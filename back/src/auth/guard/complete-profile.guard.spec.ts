import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompleteProfileGuard } from './complete-profile.guard';
import { Role } from '../../common/enum/role.enum';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';

const contextFor = (user?: UserActiveInterface): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

const member = (profileComplete: boolean): UserActiveInterface => ({
  sub: 7,
  email: 'socio@gmail.com',
  role: Role.USER,
  profileComplete,
  mustChangePassword: false,
});

const guardWith = (allowIncomplete: boolean) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(allowIncomplete),
  } as unknown as Reflector;
  return new CompleteProfileGuard(reflector);
};

describe('CompleteProfileGuard', () => {
  it('lets a complete profile through', () => {
    expect(guardWith(false).canActivate(contextFor(member(true)))).toBe(true);
  });

  it('refuses an incomplete profile', () => {
    expect(() =>
      guardWith(false).canActivate(contextFor(member(false))),
    ).toThrow(ForbiddenException);
  });

  it('refuses with the PROFILE_INCOMPLETE code the frontend redirects on', () => {
    expect.assertions(1);
    try {
      guardWith(false).canActivate(contextFor(member(false)));
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toEqual(
        expect.objectContaining({ code: 'PROFILE_INCOMPLETE' }),
      );
    }
  });

  it('lets an incomplete profile through on an opted-out route', () => {
    expect(guardWith(true).canActivate(contextFor(member(false)))).toBe(true);
  });

  it('refuses when AuthGuard attached no user', () => {
    // Defence in depth: AuthGuard runs first and always sets it, so reaching
    // here without one means the guard order changed. Deny rather than read
    // through an undefined — the same stance RolesGuard takes.
    expect(() => guardWith(false).canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('refuses a token minted before the claim existed', () => {
    // An old token has no profileComplete at all. Absent must not read as true.
    const stale = { sub: 7, email: 'x@y.z', role: Role.USER } as UserActiveInterface;
    expect(() => guardWith(false).canActivate(contextFor(stale))).toThrow(
      ForbiddenException,
    );
  });
});
