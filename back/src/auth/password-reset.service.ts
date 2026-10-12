import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../modules/user/user.service';
import { MailService } from '../common/mail/mail.service';

export const RESET_TOKEN_TTL_MINUTES = 30;
const RESET_PURPOSE = 'password-reset';

export const GENERIC_RESET_REQUEST_MESSAGE =
  'Si el correo corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.';
export const INVALID_RESET_TOKEN_MESSAGE =
  'El enlace para restablecer la contraseña no es válido o ya venció. Pide uno nuevo.';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async requestReset(email: string) {
    const user = await this.userService.findUserByEmailWithPassword(email);

    if (user && !user.deleted) {
      const token = await this.jwtService.signAsync(
        { sub: user.id, purpose: RESET_PURPOSE },
        {
          secret: this.secretFor(user.password),
          expiresIn: `${RESET_TOKEN_TTL_MINUTES}m`,
        },
      );
      const frontendUrl = (
        this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
      ).replace(/\/+$/, '');

      void this.mailService.sendPasswordReset({
        to: user.email,
        name: user.name,
        resetUrl: `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
    }

    return { message: GENERIC_RESET_REQUEST_MESSAGE };
  }

  async resetPassword(token: string, newPassword: string) {
    const unverified: unknown = this.jwtService.decode(token);
    const sub =
      unverified && typeof unverified === 'object' && 'sub' in unverified
        ? Number(unverified.sub)
        : NaN;
    if (!Number.isInteger(sub)) {
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    const user = await this.userService.findUserByIdWithPassword(sub);
    if (!user || user.deleted) {
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        purpose?: string;
      }>(token, { secret: this.secretFor(user.password) });
      if (payload.purpose !== RESET_PURPOSE || payload.sub !== user.id) {
        throw new Error('token is not a password-reset token');
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Password reset token rejected for user ${user.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    await this.userService.resetPassword(user.id, newPassword);
    return { message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' };
  }

  private secretFor(passwordHash: string | null | undefined) {
    return `${this.config.getOrThrow<string>('JWT_SECRET')}:${passwordHash ?? 'no-password'}`;
  }
}
