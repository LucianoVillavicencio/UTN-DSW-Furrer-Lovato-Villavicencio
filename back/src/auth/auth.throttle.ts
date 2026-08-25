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

/*
 * Both throttlers above are registered together in AppModule, and
 * ThrottlerGuard evaluates EVERY named throttler on EVERY request: a route
 * that carries no `@Throttle` for a given throttler still falls back to that
 * throttler's module-level default. Left alone, `contact`'s default caps the
 * whole API — every catalogue GET included — at three requests an hour, and
 * `contact` also stacks on top of login's intended five a minute.
 *
 * So each route has to say which throttlers do NOT apply to it, with the maps
 * below. Note that a bare `@SkipThrottle()` would NOT do it: with no argument
 * the decorator defaults to `{ default: true }` and skips only a throttler
 * literally named 'default', which neither of ours is.
 */

/** Everything that is neither an auth route nor the contact form. */
export const SKIP_ALL_THROTTLERS = { auth: true, contact: true };

/** Login and register: they keep AUTH_THROTTLE and nothing else. */
export const SKIP_CONTACT_THROTTLE = { contact: true };

/** The contact form: it keeps CONTACT_THROTTLE and nothing else. */
export const SKIP_AUTH_THROTTLE = { auth: true };
