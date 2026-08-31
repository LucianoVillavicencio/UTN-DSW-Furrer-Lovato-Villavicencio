import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  LessThan,
  Repository,
  UpdateResult,
} from 'typeorm';
import { SubscriptionDto } from './dto/subscription-dto';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';
import { ResolvedTerm } from '../plan/plan-duration.rules';
import {
  dayAfter,
  isCurrentOn,
  subscriptionPeriod,
  toDateOnly,
} from './subscription.rules';

@Injectable()
export class subscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // Moves the authenticated user to another plan: closes the active
  // subscription, if there is one, and opens a new one on the chosen plan. This
  // is not a payment — the charge is settled separately (in person for now,
  // through Mercado Pago later); see specs.md §2.3. Because of that, a
  // self-service change opens the new subscription PENDING and an admin
  // recording the payment is what activates it: otherwise anyone could register
  // and grant themselves an active plan for free.
  async changePlan(userId: number, planId: number, byAdmin = false) {
    const plan = await this.planService.findPlan(planId);
    if (!plan || plan.deleted) {
      throw new NotFoundException(`El plan con ID: ${planId} no existe.`);
    }

    const currentActive = await this.subscriptionRepository.findOne({
      where: {
        userId,
        state: SubscriptionState.ACTIVE,
        deleted: false,
      },
    });

    // A self-service change stays PENDING until an admin records its payment,
    // and nothing used to stop a member from asking for the same plan again
    // and again: every call opened one more PENDING row, unbounded, and any of
    // them could later be activated. One outstanding request per plan is all
    // the flow needs — to settle an existing one, record its payment against
    // it rather than opening another.
    const pendingSamePlan = await this.subscriptionRepository.findOne({
      where: {
        userId,
        planId,
        state: SubscriptionState.PENDING,
        deleted: false,
      },
    });

    // Both duplicate checks run before anything is written, so a rejected
    // change cannot leave the member's current plan already cancelled.
    if (currentActive && currentActive.planId === planId) {
      throw new ConflictException(
        byAdmin
          ? 'El socio ya está suscripto a este plan.'
          : 'Ya estás suscripto a este plan.',
      );
    }

    if (pendingSamePlan) {
      throw new ConflictException(
        byAdmin
          ? 'El socio ya tiene un cambio a este plan pendiente de pago.'
          : 'Ya tenés un cambio a este plan pendiente de pago.',
      );
    }

    // The front-desk path is supervised and swaps the plan on the spot; the
    // self-service path keeps the member's current access until the new plan's
    // payment is recorded — see `activate`, which cancels the old ACTIVE
    // subscription once the new one is paid, not before.
    const period = subscriptionPeriod(plan.numDays);

    // Both writes in one unit of work: before this, a failure between them left
    // the member with their previous plan cancelled and no replacement.
    const saved = await this.dataSource.transaction(async (manager) => {
      if (currentActive && byAdmin) {
        currentActive.state = SubscriptionState.CANCELLED;
        await manager.save(currentActive);
      }
      const newSubscription = manager.create(Subscription, {
        userId,
        planId,
        ...period,
        // A self-service change opens PENDING: it only becomes ACTIVE once an
        // admin records the payment (see PaymentService.createManualPayment).
        // The front-desk path goes through assignPlanToMember, which is
        // staff-supervised, so it keeps activating on the spot.
        state: byAdmin ? SubscriptionState.ACTIVE : SubscriptionState.PENDING,
        deleted: false,
      });
      return manager.save(newSubscription);
    });

    return this.findSubscription(saved.id);
  }

  /**
   * Opens an ACTIVE subscription on `planId` for `term`, cancelling every other
   * live subscription the member has. Runs inside the CALLER's transaction:
   * this is the front-desk sale path, where the payment row is written in the
   * same unit of work and neither may exist without the other.
   *
   * Three deliberate differences from changePlan(byAdmin), all because a member
   * is standing at the counter with money in hand:
   *  - Renewing the SAME plan is allowed. changePlan refuses it, which is right
   *    for self-service, where a member could otherwise open the same request
   *    twice, and wrong here, where renewal is the most common sale.
   *  - A stale PENDING request is CANCELLED rather than treated as a conflict.
   *    Leaving it alive would let a later payment activate it and grant a
   *    period nobody paid for twice.
   *  - A renewal with unused paid days EXTENDS them: the new period starts the
   *    day after the current ACTIVE subscription's endDate, if that endDate has
   *    not passed. Confirmed with the human owner as a product decision —
   *    activate()'s "starts when the payment lands" rule is left exactly as it
   *    is, since it answers a different question (a stale unpaid request), not
   *    this one (an early renewal with money already down).
   *
   * Every read and write goes through `manager`. Using this.subscriptionRepository
   * anywhere in here would work in the happy path and silently not roll back.
   */
  async replaceActiveSubscription(
    manager: EntityManager,
    input: { userId: number; planId: number; term: ResolvedTerm },
  ): Promise<Subscription> {
    const live = await manager.find(Subscription, {
      where: [
        {
          userId: input.userId,
          state: SubscriptionState.ACTIVE,
          deleted: false,
        },
        {
          userId: input.userId,
          state: SubscriptionState.PENDING,
          deleted: false,
        },
      ],
    });

    // Read before cancelling: once `previous.state` is overwritten below there
    // is nothing left to extend from.
    // `state` is a plain string column, so the enum member is widened to its
    // value before comparing (matches PaymentService.createManualPayment).
    const today = toDateOnly(new Date());
    const activeState: string = SubscriptionState.ACTIVE;
    const currentActive = live.find((s) => s.state === activeState);
    const from =
      currentActive && isCurrentOn(currentActive.endDate, today)
        ? dayAfter(String(currentActive.endDate))
        : new Date();

    for (const previous of live) {
      previous.state = SubscriptionState.CANCELLED;
      await manager.save(previous);
    }

    // subscriptionPeriod, not a local calculation: a subscription created here
    // and one created by changePlan must not get their dates computed
    // differently — only the `from` argument varies here.
    const created = manager.create(Subscription, {
      userId: input.userId,
      planId: input.planId,
      planDurationId: input.term.planDurationId,
      soldPrice: input.term.price,
      ...subscriptionPeriod(input.term.numDays, from),
      state: SubscriptionState.ACTIVE,
      deleted: false,
    });

    return manager.save(created);
  }

  // Same move as changePlan, made by an admin on behalf of a member who is
  // standing at the counter. The id comes from the route instead of the JWT,
  // so unlike the self-service path it has to be checked.
  async assignPlanToMember(userId: number, planId: number) {
    const member = await this.userService.findUser(userId);
    if (!member || member.deleted) {
      throw new NotFoundException(`El socio con ID: ${userId} no existe.`);
    }
    return this.changePlan(userId, planId, true);
  }

  // Full subscription history of one specific user (admin Users panel), most
  // recent first.
  async findByUser(userId: number) {
    return this.subscriptionRepository.find({
      where: { userId, deleted: false },
      relations: { plan: true },
      order: { id: 'DESC' },
    });
  }

  // Promotes a PENDING subscription once its payment is recorded. Called by
  // PaymentService so that payment never has to reach into this repository.
  // This is also where the member's previous plan actually loses access: a
  // self-service changePlan leaves the old ACTIVE subscription untouched, so
  // it has to be cancelled here, once the replacement is paid for.
  async activate(id: number) {
    const subscription = await this.findSubscription(id);
    if (!subscription) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }

    const previousActive = await this.subscriptionRepository.findOne({
      where: {
        userId: subscription.userId,
        state: SubscriptionState.ACTIVE,
        deleted: false,
      },
    });
    if (previousActive && previousActive.id !== subscription.id) {
      previousActive.state = SubscriptionState.CANCELLED;
      await this.subscriptionRepository.save(previousActive);
    }

    // A PENDING row keeps the dates it was born with. One that sat unpaid for
    // weeks — the member changed their mind, then came back — would otherwise
    // go ACTIVE with an endDate already in the past, and since nothing expires
    // a subscription yet (FLG-SEC-24) that reads as permanent access. The paid
    // period starts when the payment lands, not when it was requested.
    const plan = await this.planService.findPlan(subscription.planId);
    if (!plan) {
      throw new NotFoundException(
        `El plan con ID: ${subscription.planId} no existe.`,
      );
    }
    const period = subscriptionPeriod(plan.numDays);
    subscription.startDate = period.startDate;
    subscription.endDate = period.endDate;

    subscription.state = SubscriptionState.ACTIVE;
    return this.subscriptionRepository.save(subscription);
  }

  // The authenticated user's active subscription, or null if there is none.
  //
  // The endDate check is the security boundary for FLG-SEC-24, and it is
  // deliberately evaluated here rather than left to the nightly sweep in
  // expireLapsedSubscriptions: a sweep that fails, crashes or is never
  // registered would silently restore free access to every lapsed member, and
  // nothing would surface that it had. This check cannot fail that way — it
  // runs on the request that depends on it. Do not remove it on the grounds
  // that the sweep already sets INACTIVE.
  //
  // All four callers are covered by putting it here: enroll,
  // createClassRegistration and findMyEnrollments in classRegistration, plus
  // the member's own read in subscription.controller.
  async findActiveForUser(userId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, state: SubscriptionState.ACTIVE, deleted: false },
      relations: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    return isCurrentOn(subscription.endDate, toDateOnly(new Date()))
      ? subscription
      : null;
  }

  // Moves subscriptions that have run out to INACTIVE, nightly.
  //
  // This is BOOKKEEPING, not the access boundary — findActiveForUser already
  // refuses a lapsed subscription on every request regardless of what `state`
  // says, and it has to, because a sweep that never runs must not reopen
  // access. What this adds is a `state` column that tells the truth, so admin
  // screens that list by state instead of re-deriving currency stop showing
  // lapsed members as active. Before this, nothing in the codebase ever
  // assigned INACTIVE at all.
  //
  // LessThan, not LessThanOrEqual: a subscription ending today is still
  // current, matching isCurrentOn's inclusive boundary.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireLapsedSubscriptions(): Promise<UpdateResult> {
    return this.subscriptionRepository.update(
      {
        state: SubscriptionState.ACTIVE,
        deleted: false,
        endDate: LessThan(toDateOnly(new Date()) as unknown as Date),
      },
      { state: SubscriptionState.INACTIVE },
    );
  }

  async createSubscription(subscriptionDto: SubscriptionDto) {
    const newSubscription = this.subscriptionRepository.create({
      ...subscriptionDto,
      startDate: new Date(subscriptionDto.startDate),
      endDate: new Date(subscriptionDto.endDate),
      state: subscriptionDto.state ?? SubscriptionState.ACTIVE,
      deleted: subscriptionDto.deleted ?? false,
    });
    return await this.subscriptionRepository.save(newSubscription);
  }

  async findSubscription(id: number) {
    return await this.subscriptionRepository.findOne({
      where: { id },
      relations: { user: true, plan: true },
    });
  }

  async findAll() {
    return await this.subscriptionRepository.find({
      where: { deleted: false },
      relations: { user: true, plan: true },
    });
  }

  async findAllDeleted() {
    return await this.subscriptionRepository.find({
      where: { deleted: true },
      relations: { user: true, plan: true },
    });
  }

  async updateSubscription(subscriptionDto: SubscriptionDto) {
    if (!subscriptionDto.id) {
      throw new ConflictException(
        'El ID de la suscripción es obligatorio para actualizar.',
      );
    }
    const exists = await this.findSubscription(subscriptionDto.id);
    if (!exists) {
      throw new NotFoundException(
        `La suscripción con ID: ${subscriptionDto.id} no existe.`,
      );
    }
    const updatedsubscription = {
      ...subscriptionDto,
      startDate: subscriptionDto.startDate
        ? new Date(subscriptionDto.startDate)
        : exists.startDate,
      endDate: subscriptionDto.endDate
        ? new Date(subscriptionDto.endDate)
        : exists.endDate,
    };
    return await this.subscriptionRepository.save(updatedsubscription);
  }

  async deleteSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La suscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la suscripcion`);
    }

    return { message: `Eliminada correctamente` };
  }
  async restoreSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La suscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la suscripcion`);
    }

    return { message: `Restaurada correctamente` };
  }
}
