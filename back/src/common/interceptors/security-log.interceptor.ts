import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs';

/**
 * Logs every successful admin write (create/update/delete/restore) so an
 * incident investigation has a trace of what an admin did and when. Auth
 * failures (a 401 from AuthGuard, a 403 from RolesGuard) are NOT logged
 * here: Guards run before interceptors in Nest's pipeline, so an exception
 * a Guard throws never reaches this interceptor's handler at all — that is
 * SecurityLogFilter's job (`../filters/security-log.filter.ts`), which sits
 * outside the whole pipeline and sees every thrown exception.
 */
@Injectable()
export class SecurityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Security');

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        if (this.isAdminWrite(request, response.statusCode)) {
          this.logger.warn(this.describe(request, response.statusCode));
        }
      }),
    );
  }

  private isAdminWrite(request: Request, statusCode: number): boolean {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    return (
      isWrite &&
      statusCode < 400 &&
      (request as { user?: { role?: string } }).user?.role === 'admin'
    );
  }

  private describe(request: Request, status: number): string {
    return `${status} ${request.method} ${request.url}`;
  }
}
