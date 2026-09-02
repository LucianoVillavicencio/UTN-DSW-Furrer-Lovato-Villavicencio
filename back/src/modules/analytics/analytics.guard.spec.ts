import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OwnerPasswordGuard } from './analytics.guard';

const contextWith = (body: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  }) as ExecutionContext;

describe('OwnerPasswordGuard', () => {
  it('is unavailable when the password is not configured', () => {
    const guard = new OwnerPasswordGuard({ get: () => undefined } as never);
    expect(() =>
      guard.canActivate(contextWith({ ownerPassword: 'x' })),
    ).toThrow(ServiceUnavailableException);
  });

  it('refuses an admin who sends no password', () => {
    const guard = new OwnerPasswordGuard({ get: () => 'secret' } as never);
    // The whole point: an admin JWT alone is not enough.
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('refuses a wrong password', () => {
    const guard = new OwnerPasswordGuard({ get: () => 'secret' } as never);
    expect(() =>
      guard.canActivate(contextWith({ ownerPassword: 'nope' })),
    ).toThrow(UnauthorizedException);
  });

  it('refuses a non-string password', () => {
    const guard = new OwnerPasswordGuard({ get: () => 'secret' } as never);
    expect(() => guard.canActivate(contextWith({ ownerPassword: 42 }))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts the correct password', () => {
    const guard = new OwnerPasswordGuard({ get: () => 'secret' } as never);
    expect(guard.canActivate(contextWith({ ownerPassword: 'secret' }))).toBe(
      true,
    );
  });
});
