import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';

/**
 * A failed login, a 403 from RolesGuard, or an admin write are the events an
 * incident investigation needs and none of them currently leaves a trace
 * anywhere. One interceptor over every route, rather than a log call bolted
 * onto each guard and handler.
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
      catchError((error: { status?: number }) => {
        const status = error.status ?? 500;
        if (status === 401 || status === 403) {
          this.logger.warn(this.describe(request, status));
        }
        return throwError(() => error);
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
