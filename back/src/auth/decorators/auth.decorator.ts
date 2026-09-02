import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './role.decorator';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { CompleteProfileGuard } from '../guard/complete-profile.guard';
import { PasswordChangeGuard } from '../guard/password-change.guard';
import { Role } from '../../common/enum/role.enum';

/**
 * Guards a route. With no arguments it only requires a valid JWT; with roles it
 * also requires one of them (ADMIN always passes — see RolesGuard). Also
 * requires a completed profile (dni and phone set) unless the route carries
 * @AllowIncompleteProfile() — see CompleteProfileGuard. Also requires the
 * password to have been changed since it was generated at the front desk,
 * unless the route carries @AllowTemporaryPassword() — see PasswordChangeGuard.
 *
 * CompleteProfileGuard is composed in here rather than registered as a global
 * APP_GUARD for two reasons: it keeps the gate deny-by-default (a route added
 * later is gated unless someone opts it out, and forgetting is the safe
 * direction), and authz-matrix.spec.ts boots controllers without AppModule —
 * a global provider would be silently absent from exactly the suite that
 * exists to catch authorization mistakes.
 *
 * A method-level @Auth(...) REPLACES a class-level one — NestJS's Reflector
 * uses the nearest metadata, it does not merge. @Auth() on a method inside an
 * @Auth(Role.ADMIN) class widens that one route to any authenticated user;
 * this is used deliberately on self-service routes (see PaymentController,
 * SubscriptionController, ClassRegistrationController, UserController) and
 * is not a bug when you find it.
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard, CompleteProfileGuard, PasswordChangeGuard),
  );
}
