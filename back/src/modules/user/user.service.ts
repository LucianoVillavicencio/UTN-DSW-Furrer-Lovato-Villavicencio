import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { Repository, UpdateResult } from 'typeorm';
import { GoogleLoginDto, LoginDto, UsersDto } from './dto/users-dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UserService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async createUsers(user: UsersDto) {
    const userByDni = await this.findUser(user.dni);
    if (userByDni) {
      throw new ConflictException(
        'El usuario con DNI: ' + user.dni + ' ya existe.',
      );
    }

    const userByEmail = await this.findUserByEmail(user.email);
    if (userByEmail) {
      throw new ConflictException(
        'El usuario con email ' + user.email + ' ya existe.',
      );
    }

    const newUser = this.usersRepository.create({
      ...user,
      deleted: user.deleted ?? false,
    });

    return await this.usersRepository.save(newUser);
  }

  // Find One User by DNI
  async findUser(dni: number) {
    return await this.usersRepository.findOne({ where: { dni } });
  }

  // Find One User by Email
  async findUserByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // Login User
  async loginUser(loginDto: LoginDto) {
    const user = await this.findUserByEmail(loginDto.email);
    if (!user || user.deleted) {
      throw new NotFoundException('Usuario no encontrado o dado de baja.');
    }

    if (user.password !== loginDto.password) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Login exitoso',
      user: userWithoutPassword,
    };
  }

  // Google OAuth Login / Register
  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const rawClientId = process.env.GOOGLE_CLIENT_ID;
    const clientId = rawClientId ? rawClientId.replace(/['"]/g, '').trim() : undefined;
    let payload;

    try {
      const client = new OAuth2Client(clientId);
      const isConfigured = clientId && clientId !== 'your-google-client-id.apps.googleusercontent.com';
      const ticket = await client.verifyIdToken({
        idToken: googleLoginDto.idToken,
        audience: isConfigured ? clientId : undefined,
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      console.error('Error al verificar Google ID token:', error?.message || error);
      const errorMessage = error?.message || 'Token inválido';
      throw new UnauthorizedException(
        `Token de Google no válido: ${errorMessage}`,
      );
    }


    if (!payload || !payload.email) {
      throw new BadRequestException(
        'El token de Google no proporcionó un correo electrónico válido.',
      );
    }

    let user = await this.findUserByEmail(payload.email);

    if (user) {
      if (user.deleted) {
        throw new UnauthorizedException('El usuario se encuentra dado de baja.');
      }

      // Actualizar Google ID y Foto si no los tenía asignados
      let shouldUpdate = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        shouldUpdate = true;
      }
      if (!user.picture && payload.picture) {
        user.picture = payload.picture;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        user = await this.usersRepository.save(user);
      }
    } else {
      // Registrar un nuevo usuario autenticado con Google
      const newUser = this.usersRepository.create({
        email: payload.email,
        name: payload.given_name || payload.name || 'Usuario',
        surname: payload.family_name || '',
        picture: payload.picture || null,
        googleId: payload.sub,
        password: null,
        phone: null,
        deleted: false,
      });

      user = await this.usersRepository.save(newUser);
    }

    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Login con Google exitoso',
      user: userWithoutPassword,
    };
  }


  // Find all Users
  async findAll() {
    return await this.usersRepository.find({ where: { deleted: false } });
  }

  // Get Users deleted
  async findAllDeleted() {
    return await this.usersRepository.find({ where: { deleted: true } });
  }

  // Update User
  async updateUsers(user: UsersDto) {
    return await this.usersRepository.save(user);
  }

  // Delete User
  async deleteUsers(dni: number) {
    const userExists = await this.findUser(dni);

    if (!userExists) {
      throw new ConflictException(`El usuario con DNI: ${dni} no existe.`);
    }

    if (userExists.deleted) {
      throw new ConflictException(`El usuario ya está eliminado.`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { dni },
      { deleted: true },
    );

    return rows.affected === 1;
  }

  // Restore User
  async restoreUsers(dni: number) {
    const userExists = await this.findUser(dni);

    if (!userExists) {
      throw new ConflictException(`El usuario con DNI: ${dni} no existe.`);
    }

    if (!userExists.deleted) {
      throw new ConflictException(`El usuario no está borrado.`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { dni },
      { deleted: false },
    );

    return rows.affected === 1;
  }
}
