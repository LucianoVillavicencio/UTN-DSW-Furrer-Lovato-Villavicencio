// src/modules/user/user.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { Repository, UpdateResult } from 'typeorm';
import { UsersDto } from './dto/users-dto';
import { Role } from '../../common/enum/rol.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  // CreateUsers
  async createUsers(user: UsersDto) {
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

  // Find One User by Email (without passoword)
  async findUserByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // Find one User by email (with password)
  async findUserByEmailWithPassword(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
      select: {
        dni: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        password: true,
        role: true,
      },
    });
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
    if (!user.dni) {
      throw new ConflictException(
        'El DNI del usuario es obligatorio para actualizar.',
      );
    }
    const exists = await this.findUser(user.dni);
    if (!exists) {
      throw new NotFoundException(`El usuario con DNI: ${user.dni} no existe.`);
    }
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

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el usuario `);
    }

    return { message: `Eliminado correctamente` };
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

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el usuario `);
    }

    return { message: `Restaurado correctamente` };
  }




  // ---- GOOGLE AUTH ----
  // La verificación del idToken contra Google vive en AuthService
  // (es responsabilidad de autenticación). Acá solo resolvemos el
  // registro en la base de datos a partir de un payload ya verificado.

  // Busca un usuario por email; si ya existe, completa googleId/picture
  // si le faltaban. Si no existe, crea una cuenta nueva con rol por
  // defecto (Role.USER) y sin password local (login exclusivo por Google).
  async findOrCreateGoogleUser(googleProfile: {
    email: string;
    googleId: string;
    name: string;
    surname: string;
    picture: string | null;
  }): Promise<Users> {
    const existing = await this.findUserByEmail(googleProfile.email);

    if (existing) {
      if (existing.deleted) {
        throw new UnauthorizedException(
          'El usuario se encuentra dado de baja.',
        );
      }

  

      // Si ya hay cuenta registrada con ese email. No lo deja logearse con google.
      if (!existing.googleId) {
        throw new ConflictException(
          'Ya existe una cuenta registrada con este email. Iniciá sesión con tu contraseña.',
        );
      }

      // Ya estaba vinculada de antes: solo refrescamos la foto si cambió.
      if (googleProfile.picture && existing.picture !== googleProfile.picture) {
        existing.picture = googleProfile.picture;
        return this.usersRepository.save(existing);
      }

      return existing;
    }

    const dni = await this.generateUniqueDni();
    const newUser = this.usersRepository.create({
      dni,
      email: googleProfile.email,
      name: googleProfile.name,
      surname: googleProfile.surname,
      picture: googleProfile.picture,
      googleId: googleProfile.googleId,
      role: Role.USER,
      password: null,
      phone: null,
      deleted: false,
    });

    return this.usersRepository.save(newUser);
  }

  private async generateUniqueDni(): Promise<number> {
    let dni: number;
    do {
      dni = Math.floor(10000000 + Math.random() * 89999999);
    } while (await this.findUser(dni));
    return dni;
  }
}