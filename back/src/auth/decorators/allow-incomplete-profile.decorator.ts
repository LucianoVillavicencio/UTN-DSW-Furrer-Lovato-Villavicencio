import { SetMetadata } from '@nestjs/common';

export const ALLOW_INCOMPLETE_PROFILE = 'allowIncompleteProfile';

/**
 * Exempts a route from CompleteProfileGuard, so an account that has not yet
 * supplied its dni and phone can still reach it.
 *
 * Three routes carry this and there should not be a fourth without a reason
 * written down: GET /auth/profile (the frontend must be able to read who it is
 * talking to), POST /auth/complete-profile (the way out of the gate cannot be
 * behind the gate) and PATCH /user/me (blocking it strands anyone whose Google
 * profile came through wrong).
 */
export const AllowIncompleteProfile = () =>
  SetMetadata(ALLOW_INCOMPLETE_PROFILE, true);
