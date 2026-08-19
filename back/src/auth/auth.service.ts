import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { RegisterDto } from './dto/register-dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}


  //           ---- REGISTER ----
  async register(registerDto: RegisterDto) {

    // Validacion por Dni
    const userByDni = await this.userService.findUser(registerDto.dni);
    if (userByDni) {
      throw new ConflictException(
        `El usuario con el DNI: ${registerDto.dni} ya existe.`,
      );
    }

    //Validacion por Email
    const userByEmail = await this.userService.findUserByEmail(
      registerDto.email,
    );
    if (userByEmail) {
      throw new ConflictException(
        `El usuario con el email: ${registerDto.email} ya tiene una cuenta registrada.`,
      );
    }


    //Creo user y hasheo contraseña
    const createdUser = await this.userService.createUsers({
      ...registerDto,
      password: await bcrypt.hash(registerDto.password, 10),
    });


    // Me logea al registrarme.
    return this.buildAuthResponse(createdUser);
  }


  //           ---- LOGIN ----
  async login(loginDto: LoginDto) {

    const user = await this.userService.findUserByEmailWithPassword(loginDto.email);


    // PENDIENTE :  Dejar validaciones y mensajes de error como esta   o poner "credenciales invalidas" a todas las validaciones (mas seguro para ataques).


    //Validacion email
    if (!user) {
      throw new UnauthorizedException(
        `El usuario con email ${loginDto.email} no existe.`,
      );
    }

    //Validacion password
    if (!user.password) {
      throw new UnauthorizedException(
        `Esta cuenta se registro con Google. Inicia sesión con Google.`,
      );
    }

    // Validacion estado
    if (user.deleted) {
      throw new UnauthorizedException(`El usuario esta dado de baja`);
    }

    //Compara password ingresado con la password hasheada
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    //Valido password
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return this.buildAuthResponse(user);
  }




  //           ---- GOOGLE LOGIN / REGISTER ----

  async googleLogin(googleLoginDto: GoogleLoginDto) {

    // Verifico si el token realmente lo emitio google.
    const payload = await this.verifyGoogleToken(googleLoginDto.idToken);

    if (!payload.email || !payload.email_verified) {
      throw new BadRequestException(
        'El token de Google no proporcionó un correo electrónico verificado.',
      );
    }


    //Busco usuario.
    const user = await this.userService.findOrCreateGoogleUser({
      email: payload.email,
      googleId: payload.sub,
      name: payload.given_name || payload.name || 'Usuario',
      surname: payload.family_name || '',
      picture: payload.picture || null,
    });

    // Mismo { token, user } que login/register: para el frontend, un login
    // con Google termina siendo indistinguible de uno tradicional.
    return this.buildAuthResponse(user);
  }




  //Funcion oficial de google.

  // 1. Valida que el token este firmado con la clave primaria de Google.
  // 2. Que no este vencido
  // 3. Que audience(aud) del token coincida con mi clienteId (google Cloud)
  // 4.
  private async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/['"]/g, '').trim();

    if (
      !clientId ||
      clientId === 'your-google-client-id.apps.googleusercontent.com'
    ) {
      // Importante: NO relajamos la verificación (ej. pasando audience:
      // undefined) como fallback de "no configurado". Sin un client ID real,
      // el audience no se valida y CUALQUIER ID token válido de Google —
      // aunque haya sido emitido para una app totalmente distinta — sería
      // aceptado acá. Mejor fallar explícito que abrir ese hueco.
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
      const message = error instanceof Error ? error.message : 'Token inválido';
      throw new UnauthorizedException(`Token de Google no válido: ${message}`);
    }
  }

  async profile({ email }: { email: string; role: string }) {
    return await this.userService.findUserByEmail(email);
  }



  // Metodo privado donde se firma el JWT y arma la forma { token, user} que comparten
  // login(), register() y googleLogin(), a partir de una entidad Users completa.
  
  private async buildAuthResponse(user: {
    dni: number;
    email: string;
    name: string;
    surname?: string | null;
    phone?: string | null;
    role: string;
  }) {
    const payload = { sub: user.dni, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        dni: user.dni,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
