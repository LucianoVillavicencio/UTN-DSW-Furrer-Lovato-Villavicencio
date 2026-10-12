import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  GENERIC_RESET_REQUEST_MESSAGE,
  INVALID_RESET_TOKEN_MESSAGE,
  PasswordResetService,
} from './password-reset.service';
import { UserService } from '../modules/user/user.service';
import { MailService } from '../common/mail/mail.service';

const JWT_SECRET = 'test-secret';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let jwtService: JwtService;
  let findUserByEmailWithPassword: jest.Mock;
  let findUserByIdWithPassword: jest.Mock;
  let resetPassword: jest.Mock;
  let sendPasswordReset: jest.Mock;

  const member = {
    id: 7,
    email: 'rosa@gmail.com',
    name: 'Rosa',
    password: '$2b$10$original-hash',
    deleted: false,
  };

  beforeEach(() => {
    findUserByEmailWithPassword = jest.fn();
    findUserByIdWithPassword = jest.fn();
    resetPassword = jest.fn();
    sendPasswordReset = jest.fn().mockResolvedValue(undefined);
    jwtService = new JwtService({ secret: JWT_SECRET });
    const config = {
      get: jest.fn().mockReturnValue('http://localhost:5173/'),
      getOrThrow: jest.fn().mockReturnValue(JWT_SECRET),
    } as unknown as ConfigService;

    service = new PasswordResetService(
      {
        findUserByEmailWithPassword,
        findUserByIdWithPassword,
        resetPassword,
      } as unknown as UserService,
      jwtService,
      { sendPasswordReset } as unknown as MailService,
      config,
    );
  });

  // Requests a reset for `member` and returns the token from the mailed link.
  const issueToken = async () => {
    findUserByEmailWithPassword.mockResolvedValue(member);
    await service.requestReset(member.email);
    const [[{ resetUrl }]] = sendPasswordReset.mock.calls as [
      [{ resetUrl: string }],
    ];
    return new URL(resetUrl).searchParams.get('token')!;
  };

  const expectInvalid = async (token: string) => {
    await expect(service.resetPassword(token, 'nueva1234')).rejects.toThrow(
      new BadRequestException(INVALID_RESET_TOKEN_MESSAGE),
    );
    expect(resetPassword).not.toHaveBeenCalled();
  };

  it('answers an unknown email exactly like a known one, and mails nothing', async () => {
    findUserByEmailWithPassword.mockResolvedValue(null);

    await expect(service.requestReset('nadie@gmail.com')).resolves.toEqual({
      message: GENERIC_RESET_REQUEST_MESSAGE,
    });
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('mails nothing to a soft-deleted account', async () => {
    findUserByEmailWithPassword.mockResolvedValue({ ...member, deleted: true });

    await service.requestReset(member.email);
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('mails a link to the frontend reset page', async () => {
    const token = await issueToken();

    const [[{ resetUrl, to }]] = sendPasswordReset.mock.calls as [
      [{ resetUrl: string; to: string }],
    ];
    expect(to).toBe(member.email);
    expect(
      resetUrl.startsWith('http://localhost:5173/reset-password?token='),
    ).toBe(true);
    expect(token).toBeTruthy();
  });

  it('sets the new password for a valid token', async () => {
    const token = await issueToken();
    findUserByIdWithPassword.mockResolvedValue(member);

    await service.resetPassword(token, 'nueva1234');
    expect(resetPassword).toHaveBeenCalledWith(member.id, 'nueva1234');
  });

  it('rejects a token once the password has changed (single use)', async () => {
    const token = await issueToken();
    findUserByIdWithPassword.mockResolvedValue({
      ...member,
      password: '$2b$10$a-newer-hash',
    });

    await expectInvalid(token);
  });

  it('rejects a regular session token', async () => {
    const sessionToken = await jwtService.signAsync({
      sub: member.id,
      email: member.email,
      role: 'user',
    });
    findUserByIdWithPassword.mockResolvedValue(member);

    await expectInvalid(sessionToken);
  });

  it('rejects garbage', async () => {
    await expectInvalid('not-a-jwt');
  });
});
