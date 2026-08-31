import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { subscriptionService } from './subscription.service';
import { ClassRegistrationService } from '../classRegistration/classRegistration.service';
import { SubscriptionState } from './enum/subscription-state.enum';
import { daysOwedBack, exceedsPauseCap, MAX_PAUSE_DAYS } from './pause.rules';
import { renewalPeriod } from './subscription.rules';

// Whether pausing a membership also drops the member's future class
// reservations. Left as a findable constant rather than a config flag: the
// gym has not asked for a toggle yet, and always-on is what specs.md
// describes — a frozen membership must not hold a spot while somebody else
// is turned away from it.
export const PAUSE_CANCELS_FUTURE_RESERVATIONS = true;

@Injectable()
export class PauseService {
  private readonly logger = new Logger(PauseService.name);

  constructor(
    private readonly subscriptionService: subscriptionService,
    private readonly classRegistrationService: ClassRegistrationService,
  ) {}

  // Freezes an ACTIVE membership: access stops on the very next request
  // (findActiveForUser filters on state: ACTIVE — see the PAUSED enum
  // comment) and, per PAUSE_CANCELS_FUTURE_RESERVATIONS, every class
  // reservation the member currently holds is released — see
  // cancelFutureForUser's own doc comment for why that method's
  // CONFIRMED/CANCELLED filter, not a date, is what draws the line between
  // the ongoing spot pausing must free and the already-cancelled history it
  // must leave alone.
  //
  // cancelFutureForUser runs BEFORE the subscription is saved as PAUSED, on
  // purpose. This is not a real cross-service transaction (that would need a
  // shared EntityManager threaded across two feature modules, more than a
  // rare admin action warrants) — it just picks the safer failure mode: if
  // cancelFutureForUser throws, the subscription is never persisted as
  // PAUSED, so it simply stays ACTIVE and the admin sees the error and can
  // retry. The old order could leave a subscription PAUSED with the
  // member's class spots still reserved — silently breaking the very
  // guarantee this method exists for. The remaining edge case (reservations
  // released, then the PAUSED save itself fails) is a smaller, more benign
  // inconsistency, and is accepted rather than solved here.
  async pause(id: number, adminId: number) {
    const subscription = await this.subscriptionService.findSubscription(id);
    if (!subscription) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }

    // `state` is a plain string column, so each enum member is widened to
    // its value before comparing — same pattern as
    // payment.service.ts#promoteOrExtendSubscription.
    const pausedState: string = SubscriptionState.PAUSED;
    const activeState: string = SubscriptionState.ACTIVE;

    // One active pause at a time.
    if (subscription.state === pausedState) {
      throw new ConflictException('La suscripción ya está pausada.');
    }
    // Only a paid, currently-active membership can be frozen — a PENDING,
    // CANCELLED or INACTIVE one has nothing to pause.
    if (subscription.state !== activeState) {
      throw new ConflictException(
        'Solo se puede pausar una suscripción activa.',
      );
    }

    if (PAUSE_CANCELS_FUTURE_RESERVATIONS) {
      await this.classRegistrationService.cancelFutureForUser(
        subscription.userId,
      );
    }

    const now = new Date();
    subscription.state = SubscriptionState.PAUSED;
    subscription.pausedAt = now;
    subscription.pausedById = adminId;

    return this.subscriptionService.save(subscription);
  }

  // Resumes a PAUSED membership and hands back every day it was frozen. The
  // not-paused check runs BEFORE any date arithmetic, so a bad call fails
  // cheap and obviously instead of computing a meaningless number first.
  // exceedsPauseCap is reported (logged) but never enforced: daysOwedBack's
  // result is never truncated against MAX_PAUSE_DAYS — silently confiscating
  // paid time would be worse than a stale row (see pause.rules.ts).
  async unpause(id: number) {
    const subscription = await this.subscriptionService.findSubscription(id);
    if (!subscription) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    const pausedState: string = SubscriptionState.PAUSED;
    if (subscription.state !== pausedState) {
      throw new ConflictException('La suscripción no está pausada.');
    }

    // pausedAt is guaranteed non-null while state is PAUSED: pause() always
    // sets it together with the state, and nothing else moves state there.
    const pausedAt = subscription.pausedAt as Date;
    const today = new Date();
    const days = daysOwedBack(pausedAt, today);

    if (exceedsPauseCap(pausedAt, today)) {
      this.logger.warn(
        `La suscripción ${id} lleva más de ${MAX_PAUSE_DAYS} días pausada; ` +
          `se devuelven los ${days} días de todos modos.`,
      );
    }

    const period = renewalPeriod(subscription.endDate, days);
    subscription.endDate = period.endDate;
    subscription.state = SubscriptionState.ACTIVE;
    subscription.pausedAt = null;

    return this.subscriptionService.save(subscription);
  }
}
