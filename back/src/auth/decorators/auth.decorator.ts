import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './role.decorator';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Role } from '../../common/enum/role.enum';

/**
 * Guards a route. With no arguments it only requires a valid JWT; with roles it
 * also requires one of them (ADMIN always passes — see RolesGuard).
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}
