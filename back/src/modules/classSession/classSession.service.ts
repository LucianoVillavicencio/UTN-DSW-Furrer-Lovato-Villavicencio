import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, UpdateResult } from 'typeorm';
import { ClassSession } from './entity/classSession.entity';
import {
  ClassSessionDto,
  WeeklyClassSessionsDto,
} from './dto/classSession-dto';

// The column is a MySQL 'time', so everything is stored as 'HH:MM:SS'. An
// <input type="time"> sends 'HH:MM', which would never match a stored value.
export function toTimeOfDay(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

@Injectable()
export class ClassSessionService implements OnModuleInit {
  private readonly logger = new Logger(ClassSessionService.name);

  constructor(
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
  ) {}

  async onModuleInit() {
    try {
      await this.backfillWeeklySlots();
    } catch (error) {
      // Same reasoning as PlanService: a table that does not exist yet, or a
      // failed backfill, must not stop the application from booting.
      this.logger.warn(
        'Class session backfill skipped',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  // Turnos used to be one-off dated rows. Each one is folded into the weekly
  // slot it belonged to — the weekday and hour of its date — and its dateTime
  // is cleared, which is also the "already migrated" marker.
  private async backfillWeeklySlots() {
    const legacy = await this.classSessionRepository
      .createQueryBuilder('session')
      .where('session.dateTime IS NOT NULL')
      .getMany();

    for (const session of legacy) {
      const when = new Date(session.dateTime as Date);
      const pad = (n: number) => String(n).padStart(2, '0');
      // A legacy Sunday slot cannot exist in the weekly model (the gym is
      // closed), so it lands on Monday for an admin to move or delete.
      session.weekday = when.getDay() === 0 ? 1 : when.getDay();
      session.startTime = `${pad(when.getHours())}:${pad(when.getMinutes())}:00`;
      session.dateTime = null;
      await this.classSessionRepository.save(session);
    }

    if (legacy.length > 0) {
      this.logger.log(`${legacy.length} turno(s) migrados al esquema semanal`);
    }
  }

  // A class cannot run twice on the same weekday at the same hour, and the
  // enrollment rules read the slots of a class+hour as one group, so a
  // duplicate would double-count capacity.
  private async findSlot(
    classId: number,
    weekday: number,
    startTime: string,
    exceptId?: number,
  ) {
    return this.classSessionRepository.findOne({
      where: {
        classId,
        weekday,
        startTime: toTimeOfDay(startTime),
        deleted: false,
        ...(exceptId ? { id: Not(exceptId) } : {}),
      },
    });
  }

  async createClassSession(classSessionDto: ClassSessionDto) {
    const startTime = toTimeOfDay(classSessionDto.startTime);
    const duplicate = await this.findSlot(
      classSessionDto.classId,
      classSessionDto.weekday,
      startTime,
    );
    if (duplicate) {
      throw new ConflictException(
        'Ya existe un turno de esa clase ese día a esa hora.',
      );
    }

    const newSession = this.classSessionRepository.create({
      ...classSessionDto,
      startTime,
      dateTime: null,
      availableSpots:
        classSessionDto.availableSpots ?? classSessionDto.maxCapacity,
      deleted: classSessionDto.deleted ?? false,
    });
    return await this.classSessionRepository.save(newSession);
  }

  // Every weekday × hour combination of the admin's weekly grid. Combinations
  // that already exist are skipped instead of failing the whole save, so
  // adding one hour to a class does not mean unticking the existing ones.
  async createWeeklySlots(dto: WeeklyClassSessionsDto) {
    const created: ClassSession[] = [];
    let skipped = 0;

    for (const weekday of [...new Set(dto.weekdays)]) {
      for (const time of [...new Set(dto.times)]) {
        const startTime = toTimeOfDay(time);
        if (await this.findSlot(dto.classId, weekday, startTime)) {
          skipped++;
          continue;
        }
        created.push(
          await this.classSessionRepository.save(
            this.classSessionRepository.create({
              classId: dto.classId,
              weekday,
              startTime,
              maxCapacity: dto.maxCapacity,
              availableSpots: dto.maxCapacity,
              dateTime: null,
              deleted: false,
            }),
          ),
        );
      }
    }

    return { created: created.length, skipped, sessions: created };
  }

  async findClassSession(id: number) {
    return await this.classSessionRepository.findOne({
      where: { id },
      relations: { class: true },
    });
  }

  // Moves the remaining-spots counter as people enroll and cancel. Without
  // this the column never changes, so a session can never fill up and the
  // capacity check on enrollment can never fire.
  async adjustAvailableSpots(id: number, delta: number) {
    const session = await this.findClassSession(id);
    if (!session) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    const next = Math.min(
      session.maxCapacity,
      Math.max(0, session.availableSpots + delta),
    );
    await this.classSessionRepository.update({ id }, { availableSpots: next });
    return next;
  }

  async findAll() {
    return await this.classSessionRepository.find({
      where: { deleted: false },
      relations: { class: true },
      order: { weekday: 'ASC', startTime: 'ASC' },
    });
  }

  // Every non-deleted slot of one class at one hour: the group a member enrolls
  // in, since a plan's class allowance is spent on a class + hour, not on a
  // single day of the week.
  async findSlotsOfClassAtTime(classId: number, startTime: string) {
    return this.classSessionRepository.find({
      where: {
        classId,
        startTime: toTimeOfDay(startTime),
        deleted: false,
      },
      relations: { class: true },
      order: { weekday: 'ASC' },
    });
  }

  async findAllDeleted() {
    return await this.classSessionRepository.find({
      where: { deleted: true },
      relations: { class: true },
      order: { weekday: 'ASC', startTime: 'ASC' },
    });
  }

  async updateClassSession(classSessionDto: ClassSessionDto) {
    if (!classSessionDto.id) {
      throw new ConflictException(
        'El ID del turno de clase es obligatorio para actualizar.',
      );
    }
    const exists = await this.findClassSession(classSessionDto.id);
    if (!exists) {
      throw new NotFoundException(
        `El turno de clase con ID: ${classSessionDto.id} no existe.`,
      );
    }
    const startTime = toTimeOfDay(classSessionDto.startTime);
    const duplicate = await this.findSlot(
      classSessionDto.classId,
      classSessionDto.weekday,
      startTime,
      classSessionDto.id,
    );
    if (duplicate) {
      throw new ConflictException(
        'Ya existe un turno de esa clase ese día a esa hora.',
      );
    }

    return await this.classSessionRepository.save({
      ...classSessionDto,
      startTime,
      // Moving a slot keeps the spots already taken: capacity changes, the
      // enrolled members do not disappear.
      availableSpots: classSessionDto.availableSpots ?? exists.availableSpots,
      dateTime: null,
    });
  }

  async deleteClassSession(id: number) {
    const exists = await this.findClassSession(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El turno de clase ya está eliminado.`);
    }
    const rows: UpdateResult = await this.classSessionRepository.update(
      { id },
      { deleted: true },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el turno de clase`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreClassSession(id: number) {
    const exists = await this.findClassSession(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El turno de clase no está eliminado.`);
    }
    const rows: UpdateResult = await this.classSessionRepository.update(
      { id },
      { deleted: false },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el turno de clase`);
    }

    return { message: `Restaurado correctamente` };
  }
}
