import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { Role } from '../common/enum/role.enum';
import { Auth } from './decorators/auth.decorator';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../common/interfaces/user-active.interface';
import { GoogleLoginDto } from './dto/google-login-dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google-login')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Get('profile')
  @Auth(Role.USER)
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.authService.profile(user);
  }
}
