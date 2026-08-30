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

    const now = new Date();
    subscription.state = SubscriptionState.PAUSED;
    subscription.pausedAt = now;
    subscription.pausedById = adminId;

    const saved = await this.subscriptionService.save(subscription);

    if (PAUSE_CANCELS_FUTURE_RESERVATIONS) {
      await this.classRegistrationService.cancelFutureForUser(
        subscription.userId,
      );
    }

    return saved;
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
