import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PasswordChangeGuard } from './password-change.guard';

const contextFor = (user: unknown): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const guardWith = (allowTemporary: boolean) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(allowTemporary),
  };
  return new PasswordChangeGuard(reflector as unknown as Reflector);
};

describe('PasswordChangeGuard', () => {
  it('lets a member with a chosen password through', () => {
    expect(
      guardWith(false).canActivate(contextFor({ mustChangePassword: false })),
    ).toBe(true);
  });

  it('blocks a member still on the generated password', () => {
    expect(() =>
      guardWith(false).canActivate(contextFor({ mustChangePassword: true })),
    ).toThrow(ForbiddenException);
  });

  // A token minted before the claim existed has no such property, and absent
  // must not read as "still temporary" — that would lock out every existing
  // session on deploy.
  it('treats an absent claim as nothing to enforce', () => {
    expect(guardWith(false).canActivate(contextFor({}))).toBe(true);
  });

  it('exempts a route carrying @AllowTemporaryPassword()', () => {
    expect(
      guardWith(true).canActivate(contextFor({ mustChangePassword: true })),
    ).toBe(true);
  });
});
