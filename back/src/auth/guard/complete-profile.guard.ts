import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_INCOMPLETE_PROFILE } from '../decorators/allow-incomplete-profile.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/user-active.interface';

/**
 * Blocks an account that has not supplied its dni and phone. Runs after
 * AuthGuard and RolesGuard, and reads the claim AuthGuard attached rather than
 * the database, so it costs nothing per request.
 *
 * Deny-by-default: it is composed into @Auth(), so a route added later is
 * gated unless somebody opts it out. Forgetting is the safe direction.
 *
 * Admins are not exempt. Exempting them would mean the one account that can
 * repair member data is the one account allowed to hold bad data.
 */
@Injectable()
export class CompleteProfileGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowIncomplete = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INCOMPLETE_PROFILE,
      [context.getHandler(), context.getClass()],
    );

    if (allowIncomplete) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // `!== true` and not `!user.profileComplete`: a token minted before the
    // claim existed has no such property, and absent must not read as true.
    if (!user || user.profileComplete !== true) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PROFILE_INCOMPLETE',
        message: 'Completá tu DNI y teléfono para continuar.',
      });
    }

    return true;
  }
}
