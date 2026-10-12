import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { AUTH_THROTTLE, SKIP_CONTACT_THROTTLE } from './auth.throttle';

// Both routes are anonymous by nature — the member is here because they cannot
// log in — so AUTH_THROTTLE is their only cap, as on login and register.
@Controller('api/v1/auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ auth: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } }) // Lo limita a 5 intentos por minuto
  @SkipThrottle(SKIP_CONTACT_THROTTLE) // 
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.requestReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ auth: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } })
  @SkipThrottle(SKIP_CONTACT_THROTTLE)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }
}
