import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './role.decorator';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Role } from '../../common/enum/role.enum';

/**
 * Guards a route. With no arguments it only requires a valid JWT; with roles it
 * also requires one of them (ADMIN always passes — see RolesGuard).
 *
 * A method-level @Auth(...) REPLACES a class-level one — NestJS's Reflector
 * uses the nearest metadata, it does not merge. @Auth() on a method inside an
 * @Auth(Role.ADMIN) class widens that one route to any authenticated user;
 * this is used deliberately on self-service routes (see PaymentController,
 * SubscriptionController, ClassRegistrationController, UserController) and
 * is not a bug when you find it.
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}
