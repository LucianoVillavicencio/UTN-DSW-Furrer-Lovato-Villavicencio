import { randomUUID } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { ClassRegistration } from './entity/classRegistration.entity';
import { ClassRegistrationDto } from './dto/classRegistration-dto';
import { ChangeEnrollmentDto, EnrollClassDto } from './dto/enrollment-dto';
import { ClassRegistrationState } from './enum/classRegistration-state.enum';
import {
  ClassSessionService,
  toTimeOfDay,
} from '../classSession/classSession.service';
import { subscriptionService } from '../subscription/subscription.service';

// Business rule: a member whose plan includes a limited number of classes may
// move between classes twice per calendar month. The first enrollment of a
// member who has none is free; switching, or cancelling and coming back, is
// what costs a change.
export const MONTHLY_CLASS_CHANGES = 2;

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// Indexed by ClassSession.weekday (1 = Monday … 6 = Saturday).
const WEEKDAYS = [
  '',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

// One enrollment as the member sees it: a class at an hour, booked on every
// weekday that class runs at that hour.
export interface Enrollment {
  group: string;
  classId: number;
  className: string;
  startTime: string;
  weekdays: number[];
  sessionIds: number[];
  since: Date;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

@Injectable()
export class ClassRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(ClassRegistrationService.name);

  constructor(
    @InjectRepository(ClassRegistration)
    private classRegistrationRepository: Repository<ClassRegistration>,
    private readonly classSessionService: ClassSessionService,
    private readonly subscriptions: subscriptionService,
  ) {}

  async onModuleInit() {
    try {
      await this.backfillEnrollmentGroups();
    } catch (error) {
      this.logger.warn(
        'Class registration backfill skipped',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  // Registrations created before enrollments were grouped booked a single
  // turno each, so each one becomes its own group and keeps working.
  private async backfillEnrollmentGroups() {
    const ungrouped = await this.classRegistrationRepository.find({
      where: { enrollmentGroup: '' },
    });
    for (const registration of ungrouped) {
      registration.enrollmentGroup = randomUUID();
      await this.classRegistrationRepository.save(registration);
    }
    if (ungrouped.length > 0) {
      this.logger.log(`${ungrouped.length} inscripción(es) agrupadas`);
    }
  }

  // ---------------------------------------------------------------- members

  private async activeRegistrationsOf(userId: number) {
    return this.classRegistrationRepository.find({
      where: {
        userId,
        state: ClassRegistrationState.CONFIRMED,
        deleted: false,
      },
      relations: { classSession: true },
    });
  }

  // The active registrations folded back into the class+hour groups they were
  // created as.
  private groupRegistrations(registrations: ClassRegistration[]): Enrollment[] {
    const byGroup = new Map<string, ClassRegistration[]>();
    for (const registration of registrations) {
      const key = registration.enrollmentGroup;
      byGroup.set(key, [...(byGroup.get(key) ?? []), registration]);
    }

    return [...byGroup.entries()]
      .map(([group, rows]) => {
        const ordered = [...rows].sort(
          (a, b) =>
            (a.classSession?.weekday ?? 0) - (b.classSession?.weekday ?? 0),
        );
        const first = ordered[0];
        return {
          group,
          classId: first.classSession?.classId ?? 0,
          className: first.classSession?.class?.name ?? '',
          startTime: first.classSession?.startTime ?? '',
          weekdays: ordered.map((r) => r.classSession?.weekday ?? 0),
          sessionIds: ordered.map((r) => r.classSessionId),
          since: first.date,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Changes already spent this calendar month, counted in groups: one switch
  // books several turnos but costs one change.
  private async changesUsedThisMonth(userId: number) {
    const now = new Date();
    const rows = await this.classRegistrationRepository
      .createQueryBuilder('registration')
      .select('DISTINCT registration.enrollmentGroup', 'enrollmentGroup')
      .where('registration.userId = :userId', { userId })
      .andWhere('registration.isChange = true')
      .andWhere('registration.date >= :from', { from: startOfMonth(now) })
      .andWhere('registration.date < :to', { to: startOfNextMonth(now) })
      .getRawMany();
    return rows.length;
  }

  private async hasCancelledThisMonth(userId: number) {
    const now = new Date();
    const cancelled = await this.classRegistrationRepository
      .createQueryBuilder('registration')
      .where('registration.userId = :userId', { userId })
      .andWhere('registration.cancelledAt IS NOT NULL')
      .andWhere('registration.cancelledAt >= :from', {
        from: startOfMonth(now),
      })
      .andWhere('registration.cancelledAt < :to', { to: startOfNextMonth(now) })
      .getCount();
    return cancelled > 0;
  }

  /**
   * Everything the classes page and the dashboard need about one member: the
   * classes they hold, what their plan allows, and how many changes are left.
   */
  async findMyEnrollments(userId: number) {
    const subscription = await this.subscriptions.findActiveForUser(userId);
    // `??` is wrong for the allowance: null is a real value there (unlimited),
    // so only a missing plan or subscription falls back to "no classes".
    const maxClasses =
      subscription?.plan?.maxClasses === undefined
        ? 0
        : subscription.plan.maxClasses;
    const isLimited = maxClasses !== null;

    const enrollments = this.groupRegistrations(
      await this.activeRegistrationsOf(userId),
    );
    const changesUsed = await this.changesUsedThisMonth(userId);
    const resets = startOfNextMonth(new Date());

    return {
      enrollments,
      hasActivePlan: !!subscription,
      planName: subscription?.plan?.name ?? null,
      maxClasses,
      changesUsed,
      changesLeft: isLimited
        ? Math.max(0, MONTHLY_CLASS_CHANGES - changesUsed)
        : null,
      resetsOn: `1 de ${MONTHS[resets.getMonth()]}`,
    };
  }

  /**
   * Books a class at an hour: every weekly turno of that class at that hour, so
   * the member keeps the same spot week after week.
   */
  async enroll(
    userId: number,
    dto: EnrollClassDto,
    replacing?: string,
    bypassChangeLimit = false,
  ) {
    const startTime = toTimeOfDay(dto.startTime);

    const subscription = await this.subscriptions.findActiveForUser(userId);
    if (!subscription) {
      throw new ForbiddenException(
        'Necesitás un plan activo para inscribirte a una clase.',
      );
    }

    // null means unlimited, so `??` would turn the best plan into the worst.
    const maxClasses =
      subscription.plan?.maxClasses === undefined
        ? 0
        : subscription.plan.maxClasses;
    if (maxClasses === 0) {
      throw new ForbiddenException(
        'Tu plan no incluye clases grupales. Cambiá de plan para sumarte a una.',
      );
    }

    const slots = await this.classSessionService.findSlotsOfClassAtTime(
      dto.classId,
      startTime,
    );
    if (slots.length === 0) {
      throw new NotFoundException(
        'Ese horario no está disponible para esta clase.',
      );
    }

    const active = this.groupRegistrations(
      await this.activeRegistrationsOf(userId),
    );

    if (
      active.some((e) => e.classId === dto.classId && e.startTime === startTime)
    ) {
      throw new ConflictException('Ya estás inscripto en ese horario.');
    }

    // Enrollments that survive this one: on a switch the replaced group is on
    // its way out, so it does not count against the allowance.
    const remaining = active.filter((e) => e.group !== replacing);

    if (maxClasses !== null && remaining.length >= maxClasses) {
      throw new ConflictException(
        maxClasses === 1
          ? 'Tu plan incluye una sola clase. Cambiá la que tenés si querés otra.'
          : `Tu plan incluye ${maxClasses} clases a la vez. Cambiá alguna de las que tenés si querés otra.`,
      );
    }

    // The first enrollment of a member who holds none is free; anything after
    // that — a switch, or coming back after cancelling this month — is a change.
    const isChange =
      remaining.length > 0 ||
      !!replacing ||
      (await this.hasCancelledThisMonth(userId));

    if (isChange && maxClasses !== null && !bypassChangeLimit) {
      const used = await this.changesUsedThisMonth(userId);
      if (used >= MONTHLY_CLASS_CHANGES) {
        const resets = startOfNextMonth(new Date());
        throw new ForbiddenException(
          `Ya usaste tus ${MONTHLY_CLASS_CHANGES} cambios de clase de este mes. Vas a poder cambiar de nuevo el 1 de ${MONTHS[resets.getMonth()]}.`,
        );
      }
    }

    // One enrollment books every weekday of that hour, so a single full day
    // blocks it: the member cannot hold half a schedule.
    const full = slots.find((slot) => slot.availableSpots <= 0);
    if (full) {
      throw new ConflictException(
        `No hay cupos el ${WEEKDAYS[full.weekday] ?? 'ese día'} a las ${startTime.slice(0, 5)} hs.`,
      );
    }

    const group = randomUUID();
    const now = new Date();
    for (const slot of slots) {
      await this.classRegistrationRepository.save(
        this.classRegistrationRepository.create({
          userId,
          classSessionId: slot.id,
          enrollmentGroup: group,
          isChange,
          date: now,
          state: ClassRegistrationState.CONFIRMED,
          deleted: false,
        }),
      );
      await this.classSessionService.adjustAvailableSpots(slot.id, -1);
    }

    return this.findMyEnrollments(userId);
  }

  /**
   * Moves a member to another class or hour. The new enrollment is created
   * first and the old one released afterwards, so a failure leaves the member
   * with the class they already had instead of with none.
   */
  async changeEnrollment(
    userId: number,
    dto: ChangeEnrollmentDto,
    bypassChangeLimit = false,
  ) {
    const active = this.groupRegistrations(
      await this.activeRegistrationsOf(userId),
    );
    if (active.length === 0) {
      throw new ConflictException(
        'Todavía no tenés una clase para cambiar. Inscribite primero.',
      );
    }

    const target = dto.group
      ? active.find((e) => e.group === dto.group)
      : active.length === 1
        ? active[0]
        : undefined;

    if (!target) {
      throw new NotFoundException(
        dto.group
          ? 'Esa inscripción no existe o ya fue cancelada.'
          : 'Indicá cuál de tus clases querés cambiar.',
      );
    }

    await this.enroll(userId, dto, target.group, bypassChangeLimit);
    return await this.cancelEnrollment(userId, target.group);
  }

  /**
   * What an admin uses to change a member's class in person, ignoring the
   * monthly change cap: a member who used both changes this month still has
   * to be movable at the front desk. The plan's class-count allowance still
   * applies — this bypasses the change limit, not the plan itself.
   */
  async adminSetEnrollment(userId: number, dto: ChangeEnrollmentDto) {
    const active = this.groupRegistrations(
      await this.activeRegistrationsOf(userId),
    );
    if (active.length === 0) {
      return await this.enroll(userId, dto, undefined, true);
    }
    return await this.changeEnrollment(userId, dto, true);
  }

  /**
   * Releases a whole enrollment: every weekly turno it booked frees a spot.
   */
  async cancelEnrollment(userId: number, group: string) {
    const rows = await this.classRegistrationRepository.find({
      where: {
        userId,
        enrollmentGroup: group,
        state: ClassRegistrationState.CONFIRMED,
        deleted: false,
      },
    });
    if (rows.length === 0) {
      throw new NotFoundException(
        'Esa inscripción no existe o ya fue cancelada.',
      );
    }

    const now = new Date();
    for (const registration of rows) {
      registration.state = ClassRegistrationState.CANCELLED;
      registration.deleted = true;
      registration.cancelledAt = now;
      await this.classRegistrationRepository.save(registration);
      await this.classSessionService.adjustAvailableSpots(
        registration.classSessionId,
        1,
      );
    }

    return this.findMyEnrollments(userId);
  }

  /**
   * Releases every reservation a member holds, across ALL of their enrollment
   * groups — not one group at a time like cancelEnrollment. Used when a
   * membership is paused: access stops and next week's spot cannot sit
   * reserved while somebody else is turned away from it.
   *
   * Not filtered by `date`: since the weekly-slots migration (see
   * ClassSessionService.backfillWeeklySlots), a ClassRegistration row is a
   * standing weekly booking, not a dated occurrence — `date` records when the
   * booking was MADE (changesUsedThisMonth and the enrollments page's "since"
   * both read it that way), not a future class date. There is no column that
   * marks a row as "in the past": a CONFIRMED, non-deleted row always means
   * "currently holds this weekly spot", which is exactly what pausing must
   * release, and an already-CANCELLED row is exactly the history pausing must
   * leave alone. That distinction is what state/deleted already encode, so
   * this filters on those alone — same fields cancelEnrollment filters on,
   * just across every group instead of one.
   */
  async cancelFutureForUser(userId: number): Promise<void> {
    const rows = await this.classRegistrationRepository.find({
      where: {
        userId,
        state: ClassRegistrationState.CONFIRMED,
        deleted: false,
      },
    });

    const now = new Date();
    for (const registration of rows) {
      registration.state = ClassRegistrationState.CANCELLED;
      registration.deleted = true;
      registration.cancelledAt = now;
      await this.classRegistrationRepository.save(registration);
      await this.classSessionService.adjustAvailableSpots(
        registration.classSessionId,
        1,
      );
    }
  }

  // ------------------------------------------------------------------ admin

  // Admin-only from here down: the member-facing flow above is what the
  // classes page uses.
  async createClassRegistration(classRegistration: ClassRegistrationDto) {
    const session = await this.classSessionService.findClassSession(
      classRegistration.classSessionId,
    );
    if (!session || session.deleted) {
      throw new NotFoundException(
        `El turno de clase con ID: ${classRegistration.classSessionId} no existe.`,
      );
    }

    const activeSubscription = await this.subscriptions.findActiveForUser(
      classRegistration.userId,
    );
    if (!activeSubscription) {
      throw new ForbiddenException(
        'Necesitás un plan activo para inscribirte a una clase.',
      );
    }

    const alreadyRegistered = await this.classRegistrationRepository.findOne({
      where: {
        userId: classRegistration.userId,
        classSessionId: classRegistration.classSessionId,
        state: ClassRegistrationState.CONFIRMED,
        deleted: false,
      },
    });
    if (alreadyRegistered) {
      throw new ConflictException('Ya estás inscripto en este turno.');
    }

    if (session.availableSpots <= 0) {
      throw new ConflictException(
        'No hay cupos disponibles para este horario.',
      );
    }

    await this.classSessionService.adjustAvailableSpots(
      classRegistration.classSessionId,
      -1,
    );

    const newRegistration = this.classRegistrationRepository.create({
      ...classRegistration,
      // A row created one turno at a time is an enrollment of its own.
      enrollmentGroup: randomUUID(),
      date: classRegistration.date
        ? new Date(classRegistration.date)
        : new Date(),
      state: classRegistration.state ?? ClassRegistrationState.CONFIRMED,
      deleted: classRegistration.deleted ?? false,
    });
    return await this.classRegistrationRepository.save(newRegistration);
  }

  async findClassRegistration(id: number) {
    return await this.classRegistrationRepository.findOne({
      where: { id },
      relations: { user: true, classSession: true },
    });
  }

  async findAll() {
    return await this.classRegistrationRepository.find({
      where: { deleted: false },
      relations: { user: true, classSession: true },
    });
  }

  async findAllDeleted() {
    return await this.classRegistrationRepository.find({
      where: { deleted: true },
      relations: { user: true, classSession: true },
    });
  }

  async updateClassRegistration(classRegistration: ClassRegistrationDto) {
    if (!classRegistration.id) {
      throw new ConflictException(
        'El ID de la inscripción es obligatorio para actualizar.',
      );
    }
    const exists = await this.findClassRegistration(classRegistration.id);
    if (!exists) {
      throw new NotFoundException(
        `La inscripción con ID: ${classRegistration.id} no existe.`,
      );
    }
    const updatedClassRegistration = {
      ...classRegistration,
      enrollmentGroup: exists.enrollmentGroup,
      date: classRegistration.date
        ? new Date(classRegistration.date)
        : exists.date,
    };
    return await this.classRegistrationRepository.save(
      updatedClassRegistration,
    );
  }

  async deleteClassRegistration(id: number) {
    const exists = await this.findClassRegistration(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La inscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.classRegistrationRepository.update(
      { id },
      {
        deleted: true,
        state: ClassRegistrationState.CANCELLED,
        cancelledAt: new Date(),
      },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la inscripcion`);
    }

    // Cancelling frees the spot again.
    await this.classSessionService.adjustAvailableSpots(
      exists.classSessionId,
      1,
    );

    return { message: `Eliminada correctamente` };
  }

  async restoreClassRegistration(id: number) {
    const exists = await this.findClassRegistration(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La inscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.classRegistrationRepository.update(
      { id },
      {
        deleted: false,
        state: ClassRegistrationState.CONFIRMED,
        cancelledAt: null,
      },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la inscripcion`);
    }

    return { message: `Restaurada correctamente` };
  }
}
