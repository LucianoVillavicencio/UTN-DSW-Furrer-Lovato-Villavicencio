import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { RegisterDto } from './dto/register-dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login-dto';
import { CompleteProfileDto } from './dto/complete-profile-dto';
import { isProfileComplete } from '../modules/user/user.rules';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const userByDni = await this.userService.findUserByDni(registerDto.dni);
    if (userByDni) {
      throw new ConflictException(
        `El usuario con el DNI: ${registerDto.dni} ya existe.`,
      );
    }

    const userByEmail = await this.userService.findUserByEmail(
      registerDto.email,
    );
    if (userByEmail) {
      throw new ConflictException(
        `El usuario con el email: ${registerDto.email} ya tiene una cuenta registrada.`,
      );
    }

    const createdUser = await this.userService.createUsers({
      ...registerDto,
      password: await bcrypt.hash(registerDto.password, 10),
    });

    return this.buildAuthResponse(createdUser);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findUserByEmailWithPassword(
      loginDto.email,
    );

    const genericFailure = () =>
      new UnauthorizedException('Credenciales invalidas');

    if (!user || user.deleted || !user.password) {
      throw genericFailure();
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw genericFailure();
    }

    return this.buildAuthResponse(user);
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const payload = await this.verifyGoogleToken(googleLoginDto.idToken);

    if (!payload.email || !payload.email_verified) {
      throw new BadRequestException(
        'El token de Google no proporcionó un correo electrónico verificado.',
      );
    }

    const user = await this.userService.findOrCreateGoogleUser({
      email: payload.email,
      googleId: payload.sub,
      name: payload.given_name || payload.name || 'Usuario',
      surname: payload.family_name || '',
      picture: payload.picture || null,
    });

    // Same { token, user } shape as login/register, so a Google sign-in is
    // indistinguishable from a regular one on the frontend.
    return this.buildAuthResponse(user);
  }

  private async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/['"]/g, '').trim();

    if (
      !clientId ||
      clientId === 'your-google-client-id.apps.googleusercontent.com'
    ) {
      // Do NOT relax the check (for example by passing audience: undefined)
      // as a "not configured" fallback. Without a real client ID the audience
      // goes unverified and ANY valid Google ID token — even one issued for a
      // completely different app — would be accepted here. Failing loudly is
      // the safer default.
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID no está configurado en el servidor.',
      );
    }

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('El token no trae payload.');
      }

      return payload;
    } catch (error: unknown) {
      this.logger.warn(
        `Google token verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new UnauthorizedException('Token de Google no válido.');
    }
  }

  // Returns a freshly signed token. This is what releases the gate: without a
  // new token the member keeps a claim that says profileComplete: false and
  // stays locked out until the old one expires.
  async completeProfile(id: number, dto: CompleteProfileDto) {
    const user = await this.userService.completeProfile(id, dto);
    return this.buildAuthResponse(user);
  }

  async profile({ email }: { email: string; role: string }) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      return null;
    }
    return { ...user, profileComplete: isProfileComplete(user) };
  }

  // Signs the JWT and builds the { token, user } shape shared by login(),
  // register(), googleLogin() and completeProfile().
  private async buildAuthResponse(user: {
    id: number;
    dni?: number | null;
    email: string;
    name: string;
    surname?: string | null;
    phone?: string | null;
    role: string;
    mustChangePassword?: boolean;
  }) {
    const profileComplete = isProfileComplete(user);
    const mustChangePassword = user.mustChangePassword === true;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileComplete,
      mustChangePassword,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        dni: user.dni ?? null,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        role: user.role,
        profileComplete,
        mustChangePassword,
      },
    };
  }
}
