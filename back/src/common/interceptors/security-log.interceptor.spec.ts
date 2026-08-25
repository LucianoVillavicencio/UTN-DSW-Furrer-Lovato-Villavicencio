import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { SecurityLogInterceptor } from './security-log.interceptor';

function contextFor(
  statusCode: number,
  method = 'POST',
  url = '/api/v1/plan',
  user?: { role?: string },
) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, url, user }),
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

describe('SecurityLogInterceptor', () => {
  let interceptor: SecurityLogInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new SecurityLogInterceptor();
    logSpy = jest.spyOn(interceptor['logger'], 'warn').mockImplementation();
  });

  it('logs a successful admin write', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        contextFor(201, 'POST', '/api/v1/plan', { role: 'admin' }),
        handler,
      )
      .subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('201 POST /api/v1/plan'),
          );
          done();
        },
      });
  });

  it('does not log a normal successful request with no user', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor.intercept(contextFor(200), handler).subscribe({
      next: () => {
        expect(logSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not log a non-admin write', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        contextFor(201, 'POST', '/api/v1/classRegistration/enroll', {
          role: 'user',
        }),
        handler,
      )
      .subscribe({
        next: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
  });

  it('does not log an admin GET (read, not a write)', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        contextFor(200, 'GET', '/api/v1/user', { role: 'admin' }),
        handler,
      )
      .subscribe({
        next: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
  });

  it('does not log an admin write that failed', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        contextFor(400, 'POST', '/api/v1/plan', { role: 'admin' }),
        handler,
      )
      .subscribe({
        next: () => {
          expect(logSpy).not.toHaveBeenCalled();
          done();
        },
      });
  });
});
