import { SetMetadata } from '@nestjs/common';

export const ALLOW_TEMPORARY_PASSWORD = 'allowTemporaryPassword';

/**
 * Exempts a route from PasswordChangeGuard, so a member still holding the
 * password the front desk generated for them can still reach it.
 *
 * Three routes carry this and there should not be a fourth without a reason
 * written down: GET /auth/profile (the frontend must be able to read who it is
 * talking to), POST /auth/change-password and PATCH /user/me (both are ways
 * out of the gate, and the way out cannot be behind the gate).
 */
export const AllowTemporaryPassword = () =>
  SetMetadata(ALLOW_TEMPORARY_PASSWORD, true);
