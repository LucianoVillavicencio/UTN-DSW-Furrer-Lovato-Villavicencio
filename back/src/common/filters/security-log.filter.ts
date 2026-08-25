import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Guards run before interceptors in Nest's pipeline, so a 401 from AuthGuard
 * or a 403 from RolesGuard never reaches an interceptor's catchError — only
 * an exception filter, which sits outside the whole pipeline, sees them.
 * This is the real log point for auth failures, whether thrown by a Guard
 * or by service logic. SecurityLogInterceptor keeps logging successful
 * admin writes, which do reach it normally.
 */
@Catch(UnauthorizedException, ForbiddenException)
export class SecurityLogFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('Security');

  catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ) {
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception.getStatus();
    this.logger.warn(`${status} ${request.method} ${request.url}`);
    super.catch(exception, host);
  }
}
