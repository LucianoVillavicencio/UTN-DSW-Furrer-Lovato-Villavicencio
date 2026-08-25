import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../modules/user/user.service';

// bcrypt is a native binding; its exports are not configurable, so
// jest.spyOn(bcrypt, 'compare') fails with "Cannot redefine property".
// Mocking the whole module up front avoids that.
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockedCompare = bcrypt.compare as unknown as jest.Mock;

// FLG-SEC-01: login() must converge every failure branch (unknown email,
// Google-only account, front-desk account with no password, soft-deleted
// account, wrong password) on the exact same message, so an anonymous caller
// cannot use the response to enumerate which accounts exist. Each test below
// asserts the exact message text, not just "some 401" — a regression that
// reintroduces a distinct message on any one branch must fail here.

describe('AuthService.login', () => {
  const GENERIC_MESSAGE = 'Credenciales invalidas';

  let authService: AuthService;
  let findUserByEmailWithPassword: jest.Mock;

  beforeEach(() => {
    findUserByEmailWithPassword = jest.fn();
    const userService = {
      findUserByEmailWithPassword,
    } as unknown as UserService;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as JwtService;

    authService = new AuthService(userService, jwtService);
    mockedCompare.mockReset();
  });

  const expectGenericFailure = async (password = 'whatever1') => {
    expect.assertions(2);
    try {
      await authService.login({ email: 'someone@gmail.com', password });
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as Error).message).toBe(GENERIC_MESSAGE);
    }
  };

  it('rejects an unknown email with the generic message', async () => {
    findUserByEmailWithPassword.mockResolvedValue(null);

    await expectGenericFailure();
  });

  it('rejects a Google-only account with the generic message', async () => {
    findUserByEmailWithPassword.mockResolvedValue({
      dni: 1,
      email: 'google-user@gmail.com',
      name: 'Google',
      password: null,
      googleId: 'google-sub-id',
      deleted: false,
      role: 'user',
    });

    await expectGenericFailure();
  });

  it('rejects a front-desk account with no password with the generic message', async () => {
    findUserByEmailWithPassword.mockResolvedValue({
      dni: 2,
      email: 'front-desk@gmail.com',
      name: 'Front Desk',
      password: null,
      googleId: null,
      deleted: false,
      role: 'user',
    });

    await expectGenericFailure();
  });

  it('rejects a soft-deleted account with the generic message', async () => {
    findUserByEmailWithPassword.mockResolvedValue({
      dni: 3,
      email: 'gone@gmail.com',
      name: 'Gone',
      password: 'hashed-password',
      googleId: null,
      deleted: true,
      role: 'user',
    });

    await expectGenericFailure();
  });

  it('rejects a wrong password on a real account with the generic message', async () => {
    findUserByEmailWithPassword.mockResolvedValue({
      dni: 4,
      email: 'rosa@gmail.com',
      name: 'Rosa',
      password: 'hashed-password',
      googleId: null,
      deleted: false,
      role: 'user',
    });
    mockedCompare.mockResolvedValue(false);

    await expectGenericFailure('wrong-password1');
  });

  it('does not throw and returns a token for a correct password', async () => {
    findUserByEmailWithPassword.mockResolvedValue({
      dni: 5,
      email: 'ok@gmail.com',
      name: 'Ok',
      password: 'hashed-password',
      googleId: null,
      deleted: false,
      role: 'user',
    });
    mockedCompare.mockResolvedValue(true);

    const result = await authService.login({
      email: 'ok@gmail.com',
      password: 'right-pass1',
    });

    expect(result.token).toBe('signed-token');
    expect(result.user.email).toBe('ok@gmail.com');
  });
});
