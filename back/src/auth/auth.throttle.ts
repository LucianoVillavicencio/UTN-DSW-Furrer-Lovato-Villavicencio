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
