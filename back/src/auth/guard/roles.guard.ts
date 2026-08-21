import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { Role } from '../../common/enum/role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/user-active.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // AuthGuard runs first and always sets it; without a user there is no role
    // to check, so deny instead of reading through an undefined.
    if (!user) {
      return false;
    }

    // ADMIN passes every check, whatever roles the endpoint asks for.
    if (user.role === Role.ADMIN) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
