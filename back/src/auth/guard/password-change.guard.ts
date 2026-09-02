import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_TEMPORARY_PASSWORD } from '../decorators/allow-temporary-password.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/user-active.interface';

/**
 * Blocks an account still using the password the front desk generated for it.
 * Runs after AuthGuard and reads the claim AuthGuard attached rather than the
 * database, so it costs nothing per request.
 *
 * Deny-by-default, like CompleteProfileGuard: it is composed into @Auth(), so
 * a route added later is gated unless somebody opts it out.
 *
 * Admins are not exempt. An admin account created at the counter is on a
 * printed password like anybody else.
 */
@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowTemporary = this.reflector.getAllAndOverride<boolean>(
      ALLOW_TEMPORARY_PASSWORD,
      [context.getHandler(), context.getClass()],
    );

    if (allowTemporary) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // `=== true` and not a truthiness check: a token minted before this claim
    // existed has no such property, and absent must not read as "temporary" —
    // that would lock out every session live at deploy time.
    if (user?.mustChangePassword === true) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Cambiá tu contraseña para continuar.',
      });
    }

    return true;
  }
}
