import type { ThrottlerOptions } from '@nestjs/throttler';

/**
 * Five attempts per minute per address. Tight enough that guessing a password
 * is impractical, loose enough that a member who mistypes twice and retries is
 * never locked out.
 */
export const AUTH_THROTTLE: ThrottlerOptions = {
  name: 'auth',
  ttl: 60_000,
  limit: 5,
};

/** The contact form is anonymous, so it is a free mail relay without a cap. */
export const CONTACT_THROTTLE: ThrottlerOptions = {
  name: 'contact',
  ttl: 3_600_000,
  limit: 3,
};

/**
 * The Mercado Pago webhook is the one route in the whole app with no
 * `@Auth()` in front of it at all — rate limiting is its only defense against
 * being hammered. 100/min is ample for MP's own retry bursts (it retries a
 * single notification at 0, 15min, 30min, 6h, 48h, 96h — never anywhere close
 * to this rate) while still bounding a flood from anyone else.
 */
export const WEBHOOK_THROTTLE: ThrottlerOptions = {
  name: 'webhook',
  ttl: 60_000,
  limit: 100,
};

/**
 * Every throttler registered on the app, in one place. `app.module.ts`'s
 * `ThrottlerModule.forRoot(...)` call reads this array directly rather than
 * listing the throttlers itself, so adding a fourth throttler here is the one
 * edit that cannot be skipped — see the SKIP_ALL_THROTTLERS coverage test in
 * auth.throttle.spec.ts, which walks this same array.
 */
export const REGISTERED_THROTTLERS: ThrottlerOptions[] = [
  AUTH_THROTTLE,
  CONTACT_THROTTLE,
  WEBHOOK_THROTTLE,
];

/*
 * All the throttlers above are registered together in AppModule, and
 * ThrottlerGuard evaluates EVERY named throttler on EVERY request: a route
 * that carries no `@Throttle` for a given throttler still falls back to that
 * throttler's module-level default. Left alone, `contact`'s default caps the
 * whole API — every catalogue GET included — at three requests an hour, and
 * `contact` also stacks on top of login's intended five a minute.
 *
 * So each route has to say which throttlers do NOT apply to it, with the maps
 * below. Note that a bare `@SkipThrottle()` would NOT do it: with no argument
 * the decorator defaults to `{ default: true }` and skips only a throttler
 * literally named 'default', which none of ours is.
 */

/** Everything that is neither an auth route, the contact form, nor the webhook. */
export const SKIP_ALL_THROTTLERS = { auth: true, contact: true, webhook: true };

/** Login and register: they keep AUTH_THROTTLE and nothing else. */
export const SKIP_CONTACT_THROTTLE = { contact: true };

/** The contact form: it keeps CONTACT_THROTTLE and nothing else. */
export const SKIP_AUTH_THROTTLE = { auth: true };
