import { Body, Controller, Get, Post } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { Role } from '../common/enum/role.enum';
import { Auth } from './decorators/auth.decorator';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../common/interfaces/user-active.interface';
import { GoogleLoginDto } from './dto/google-login-dto';
import { CompleteProfileDto } from './dto/complete-profile-dto';
import {
  AUTH_THROTTLE,
  SKIP_ALL_THROTTLERS,
  SKIP_CONTACT_THROTTLE,
} from './auth.throttle';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // AUTH_THROTTLE applies here and nowhere else; the @SkipThrottle keeps
  // CONTACT_THROTTLE's three-an-hour default off these two, which would
  // otherwise be the binding limit. See auth.throttle.ts.
  @Post('register')
  @Throttle({ auth: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } })
  @SkipThrottle(SKIP_CONTACT_THROTTLE)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ auth: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } })
  @SkipThrottle(SKIP_CONTACT_THROTTLE)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Google already rate limits the token exchange on its side, so this one is
  // left uncapped rather than sharing the password throttler.
  @Post('google-login')
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Get('profile')
  @Auth(Role.USER)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.authService.profile(user);
  }

  // Reachable by an account that is not yet complete — see
  // @AllowIncompleteProfile in Task 5. The way out of the gate cannot be
  // behind the gate.
  @Post('complete-profile')
  @Auth(Role.USER)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  completeProfile(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.authService.completeProfile(user.sub, dto);
  }
}
