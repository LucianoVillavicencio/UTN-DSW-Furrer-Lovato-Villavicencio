import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { SecurityLogInterceptor } from './security-log.interceptor';

function contextFor(
  statusCode: number,
  method = 'POST',
  url = '/api/v1/auth/login',
) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, url }),
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

  it('logs a 401 on the login route', (done) => {
    const handler: CallHandler = {
      handle: () => throwError(() => ({ status: 401 })),
    };
    interceptor.intercept(contextFor(401), handler).subscribe({
      error: () => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('401'));
        done();
      },
    });
  });

  it('logs a 403', (done) => {
    const handler: CallHandler = {
      handle: () => throwError(() => ({ status: 403 })),
    };
    interceptor
      .intercept(contextFor(403, 'GET', '/api/v1/contact'), handler)
      .subscribe({
        error: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('403'));
          done();
        },
      });
  });

  it('does not log a normal successful request', (done) => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    interceptor.intercept(contextFor(200), handler).subscribe({
      next: () => {
        expect(logSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
