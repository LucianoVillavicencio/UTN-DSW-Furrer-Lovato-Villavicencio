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
import { UsersDto } from './dto/users-dto';
import { UpdateProfileDto } from './dto/update-profile-dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import { AdminCreateUserDto } from './dto/admin-create-user-dto';
import { findAdminCreateUserError, placeholderEmailFor } from './user.rules';
import { Role } from '../../common/enum/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  async createUsers(user: UsersDto) {
    const newUser = this.usersRepository.create({
      ...user,
      deleted: user.deleted ?? false,
    });

    return await this.usersRepository.save(newUser);
  }

  // Front-desk creation: no self-registration, so the duplicate checks and the
  // password hashing that auth.service.register does have to happen here too.
  // It returns through findUser() so the password column, which is select:false
  // on the entity but present on the object just saved, never leaves the API.
  async adminCreateUser(dto: AdminCreateUserDto) {
    const ruleError = findAdminCreateUserError(dto);
    if (ruleError) {
      throw new BadRequestException(ruleError);
    }

    const existingByDni = await this.findUser(dto.dni);
    if (existingByDni) {
      throw new ConflictException(
        `El usuario con el DNI: ${dto.dni} ya existe.`,
      );
    }

    const typedEmail = dto.email?.trim();
    if (typedEmail) {
      const existingByEmail = await this.findUserByEmail(typedEmail);
      if (existingByEmail) {
        throw new ConflictException(
          `El usuario con el email: ${typedEmail} ya tiene una cuenta registrada.`,
        );
      }
    }

    const newUser = this.usersRepository.create({
      dni: dto.dni,
      name: dto.name,
      surname: dto.surname,
      phone: dto.phone?.trim() || null,
      email: typedEmail || placeholderEmailFor(dto.dni),
      password: dto.password ? await bcrypt.hash(dto.password, 10) : null,
      role: Role.USER,
      deleted: false,
    });
    await this.usersRepository.save(newUser);

    return this.findUser(dto.dni);
  }

  async findUser(dni: number) {
    return await this.usersRepository.findOne({ where: { dni } });
  }

  async findUserByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

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
        googleId: true,
        role: true,
        // Without this, AuthService's `if (user.deleted)` check never fires:
        // TypeORM's object-form select only hydrates listed columns, so a
        // soft-deleted member could still log in.
        deleted: true,
      },
    });
  }

  async findAll() {
    return await this.usersRepository.find({ where: { deleted: false } });
  }

  // Admin search: dni and email match exactly, name/surname match with a
  // partial LIKE. Every filter is independent, so searching by just one is
  // valid; with none of them this behaves like findAll().
  async searchUsers(query: {
    dni?: number;
    email?: string;
    name?: string;
    surname?: string;
  }) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      // QueryBuilder ignores the entity's select:false, unlike
      // Repository.find/findOne, so the columns are listed by hand rather than
      // risk returning the password hash.
      .select([
        'user.dni',
        'user.email',
        'user.name',
        'user.surname',
        'user.phone',
        'user.role',
        'user.googleId',
        'user.picture',
        'user.deleted',
      ])
      .where('user.deleted = false');

    if (query.dni) {
      qb.andWhere('user.dni = :dni', { dni: query.dni });
    }
    if (query.email) {
      qb.andWhere('user.email = :email', { email: query.email });
    }
    if (query.name) {
      qb.andWhere('user.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.surname) {
      qb.andWhere('user.surname LIKE :surname', {
        surname: `%${query.surname}%`,
      });
    }

    // password is select:false on the entity, so there is no need to strip it
    // here: TypeORM does not load it unless it is asked for explicitly.
    return qb.orderBy('user.name', 'ASC').take(50).getMany();
  }

  async findAllDeleted() {
    return await this.usersRepository.find({ where: { deleted: true } });
  }

  // Self-service profile update. dni always comes from the JWT (see
  // UserController#updateMyProfile), never from the body, so a user cannot edit
  // another user's record even by trying.
  async updateProfile(dni: number, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { dni },
      select: {
        dni: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        password: true,
        role: true,
        googleId: true,
        picture: true,
        deleted: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`El usuario con DNI: ${dni} no existe.`);
    }

    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.findUserByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictException(
          `El email ${dto.email} ya está en uso por otra cuenta.`,
        );
      }
      user.email = dto.email;
    }

    if (dto.name) user.name = dto.name;
    if (dto.surname) user.surname = dto.surname;
    if (dto.phone) user.phone = dto.phone;

    if (dto.newPassword) {
      if (!user.password) {
        throw new ConflictException(
          'Esta cuenta inició sesión con Google y no tiene contraseña local.',
        );
      }
      const currentValid = await bcrypt.compare(
        dto.currentPassword ?? '',
        user.password,
      );
      if (!currentValid) {
        throw new UnauthorizedException('La contraseña actual es incorrecta.');
      }
      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const saved = await this.usersRepository.save(user);
    const { password: _password, ...safeUser } = saved;
    return safeUser;
  }

  // Admin-side edit (Users panel). Unlike the updateUsers/UsersDto pair that
  // PUT /user used before that route was deleted, it never touches password,
  // so there is no risk of storing an unhashed value.
  async adminUpdateUser(dni: number, dto: AdminUpdateUserDto) {
    // Explicit select including password, same as updateProfile: without it,
    // save() on an entity that is missing the column can overwrite it with
    // null.
    const user = await this.usersRepository.findOne({
      where: { dni },
      select: {
        dni: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        password: true,
        role: true,
        googleId: true,
        picture: true,
        deleted: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`El usuario con DNI: ${dni} no existe.`);
    }

    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.findUserByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictException(
          `El email ${dto.email} ya está en uso por otra cuenta.`,
        );
      }
      user.email = dto.email;
    }

    if (dto.name) user.name = dto.name;
    if (dto.surname) user.surname = dto.surname;
    if (dto.phone) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;

    const saved = await this.usersRepository.save(user);
    const { password: _password, ...safeUser } = saved;
    return safeUser;
  }

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

  // Verifying the idToken against Google lives in AuthService, since that is an
  // authentication concern. Here we only resolve the database record from an
  // already verified payload: look the user up by email and fill in a missing
  // googleId/picture, or create a new account with the default role
  // (Role.USER) and no local password, so it can only be used through Google.
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

      // An account already exists for that email, so Google sign-in is refused.
      if (!existing.googleId) {
        throw new ConflictException(
          'Ya existe una cuenta registrada con este email. Iniciá sesión con tu contraseña.',
        );
      }

      // Already linked earlier: only refresh the picture if it changed.
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
