import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { matchesOwnerPassword } from './analytics.rules';

/**
 * Re-checks the owner password on EVERY analytics request.
 *
 * A guard rather than a check inside the service, so a second analytics route
 * added later cannot forget it — the same deny-by-default reasoning
 * CompleteProfileGuard is composed into @Auth for. The frontend's prompt is a
 * convenience; this is the control. Any admin JWT without the correct
 * password gets a 401, which is what makes the panel a real boundary and not
 * a hidden div.
 */
@Injectable()
export class OwnerPasswordGuard implements CanActivate {
  private readonly logger = new Logger(OwnerPasswordGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('OWNER_ANALYTICS_PASSWORD');

    if (!expected) {
      // Not getOrThrow at boot: the variable is optional and a deployment that
      // does not use this panel must still start. Not a default value either —
      // a default password is a backdoor.
      this.logger.warn(
        'OWNER_ANALYTICS_PASSWORD is not set; the analytics panel is disabled.',
      );
      throw new ServiceUnavailableException(
        'La vista financiera no está configurada en este servidor.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const supplied = (request.body as { ownerPassword?: unknown } | undefined)
      ?.ownerPassword;

    // Read from the raw body, not the validated DTO: guards run before pipes.
    if (
      typeof supplied !== 'string' ||
      !matchesOwnerPassword(supplied, expected)
    ) {
      throw new UnauthorizedException('La contraseña no es correcta.');
    }

    return true;
  }
}
