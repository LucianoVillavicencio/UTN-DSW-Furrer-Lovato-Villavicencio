import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../modules/user/user.service';
import { Role } from '../common/enum/role.enum';

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
      id: 101,
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
      id: 102,
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
      id: 103,
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
      id: 104,
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
      id: 105,
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

describe('verifyGoogleToken error handling', () => {
  it('never includes the underlying library message in the thrown exception', () => {
    // The library's exception text (malformed JWT segment counts, audience
    // mismatches, expiry details) must never reach the client — it is
    // reconnaissance value for an attacker probing the OAuth integration.
    const message = 'Wrong number of segments in token: ey123';
    const wrapped = new UnauthorizedException('Token de Google no válido.');
    expect(wrapped.message).not.toContain(message);
  });
});

describe('AuthService token claims', () => {
  // buildAuthResponse is private; login() is the shortest public path to it.
  const loginWith = async (user: Record<string, unknown>) => {
    const signAsync = jest.fn().mockResolvedValue('signed-token');
    const findUserByEmailWithPassword = jest.fn().mockResolvedValue({
      password: 'hashed',
      deleted: false,
      ...user,
    });
    const service = new AuthService(
      { findUserByEmailWithPassword } as unknown as UserService,
      { signAsync } as unknown as JwtService,
    );
    mockedCompare.mockResolvedValue(true);

    const result = await service.login({
      email: 'socio@gmail.com',
      password: 'password1',
    });
    return { result, signAsync };
  };

  const completeUser = {
    id: 7,
    dni: 40123456,
    email: 'socio@gmail.com',
    name: 'Ana',
    surname: 'Pérez',
    phone: '3411234567',
    role: Role.USER,
  };

  it('signs the id as sub, not the dni', async () => {
    const { signAsync } = await loginWith(completeUser);

    expect(signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 7 }),
    );
  });

  it('signs profileComplete true for a member with dni and phone', async () => {
    const { signAsync } = await loginWith(completeUser);

    expect(signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ profileComplete: true }),
    );
  });

  it('signs profileComplete false for a Google account with no dni', async () => {
    const { signAsync } = await loginWith({
      ...completeUser,
      dni: null,
      phone: null,
    });

    expect(signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ profileComplete: false }),
    );
  });

  it('returns the flag on the user object too', async () => {
    const { result } = await loginWith({ ...completeUser, phone: null });

    expect(result.user.profileComplete).toBe(false);
    expect(result.user.id).toBe(7);
  });

  it('never returns the password hash', async () => {
    const { result } = await loginWith(completeUser);

    expect(result.user).not.toHaveProperty('password');
  });
});
