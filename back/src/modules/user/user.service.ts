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
import { CompleteProfileDto } from '../../auth/dto/complete-profile-dto';
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

    const existingByDni = await this.findUserByDni(dto.dni);
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
    const saved = await this.usersRepository.save(newUser);

    return this.findUser(saved.id);
  }

  async findUser(id: number) {
    return await this.usersRepository.findOne({ where: { id } });
  }

  // Used by the duplicate checks, and by nothing else. Addressing a member for
  // read or write always goes through findUser(id).
  async findUserByDni(dni: number) {
    return await this.usersRepository.findOne({ where: { dni } });
  }

  async findUserByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findUserByEmailWithPassword(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
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

  // Admin search: id and dni and email match exactly, name/surname match with
  // a partial LIKE. Every filter is independent, so searching by just one is
  // valid. Searching by dni survives this change deliberately — it is how the
  // front desk finds a member by the number on their document.
  async searchUsers(query: {
    id?: number;
    dni?: number;
    email?: string;
    name?: string;
    surname?: string;
  }) {
    const hasId = Number.isFinite(query.id);
    const hasDni = Number.isFinite(query.dni);
    const hasEmail = !!query.email?.trim();
    const hasName = !!query.name?.trim();
    const hasSurname = !!query.surname?.trim();

    // Before this, a NaN dni — what Number('40.123.456') gives — failed the old
    // truthiness test, no filter was applied, and the caller got the first 50
    // members back as if they were search results.
    if (!hasId && !hasDni && !hasEmail && !hasName && !hasSurname) {
      throw new BadRequestException(
        'Indicá un criterio de búsqueda válido (ID, DNI, email o nombre).',
      );
    }

    const qb = this.usersRepository
      .createQueryBuilder('user')
      // QueryBuilder ignores the entity's select:false, unlike
      // Repository.find/findOne, so the columns are listed by hand rather than
      // risk returning the password hash.
      .select([
        'user.id',
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

    if (hasId) qb.andWhere('user.id = :id', { id: query.id });
    if (hasDni) qb.andWhere('user.dni = :dni', { dni: query.dni });
    if (hasEmail)
      qb.andWhere('user.email = :email', { email: query.email?.trim() });
    if (hasName)
      qb.andWhere('user.name LIKE :name', { name: `%${query.name?.trim()}%` });
    if (hasSurname) {
      qb.andWhere('user.surname LIKE :surname', {
        surname: `%${query.surname?.trim()}%`,
      });
    }

    return qb.orderBy('user.name', 'ASC').take(50).getMany();
  }

  async findAllDeleted() {
    return await this.usersRepository.find({ where: { deleted: true } });
  }

  // Self-service profile update. id always comes from the JWT (see
  // UserController#updateMyProfile), never from the body, so a user cannot edit
  // another user's record even by trying.
  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
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
      throw new NotFoundException(`El usuario con ID: ${id} no existe.`);
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
  async adminUpdateUser(id: number, dto: AdminUpdateUserDto) {
    // Explicit select including password, same as updateProfile: without it,
    // save() on an entity that is missing the column can overwrite it with
    // null.
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
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
      throw new NotFoundException(`El usuario con ID: ${id} no existe.`);
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

    // The admin correction path for a write-once field. A member cannot do
    // this to themselves: UpdateProfileDto carries no dni.
    if (dto.dni != null && dto.dni !== user.dni) {
      const dniTaken = await this.findUserByDni(dto.dni);
      if (dniTaken) {
        throw new ConflictException(
          `El DNI ${dto.dni} ya está en uso por otra cuenta.`,
        );
      }
      user.dni = dto.dni;
    }

    if (dto.name) user.name = dto.name;
    if (dto.surname) user.surname = dto.surname;
    if (dto.phone) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;

    const saved = await this.usersRepository.save(user);
    const { password: _password, ...safeUser } = saved;
    return safeUser;
  }

  async deleteUsers(id: number) {
    const userExists = await this.findUser(id);

    if (!userExists) {
      throw new ConflictException(`El usuario con ID: ${id} no existe.`);
    }

    if (userExists.deleted) {
      throw new ConflictException(`El usuario ya está eliminado.`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { id },
      { deleted: true },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el usuario `);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreUsers(id: number) {
    const userExists = await this.findUser(id);

    if (!userExists) {
      throw new ConflictException(`El usuario con ID: ${id} no existe.`);
    }

    if (!userExists.deleted) {
      throw new ConflictException(`El usuario no está borrado.`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { id },
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

    // No dni and no phone: Google does not tell us either. The account is
    // "incomplete" until the member fills them in through
    // POST /auth/complete-profile, and CompleteProfileGuard keeps it from
    // being used for anything else until then.
    const newUser = this.usersRepository.create({
      email: googleProfile.email,
      name: googleProfile.name,
      surname: googleProfile.surname,
      picture: googleProfile.picture,
      googleId: googleProfile.googleId,
      role: Role.USER,
      password: null,
      dni: null,
      phone: null,
      deleted: false,
    });

    return this.usersRepository.save(newUser);
  }

  // Fills in the fields a Google sign-in cannot supply. The caller comes from
  // the JWT (see AuthController#completeProfile) — the body never names a
  // user, so nobody can complete somebody else's profile.
  //
  // The dni is write-once for the member: once set, a value in the body is
  // dropped rather than refused, so a walk-in member adding only a missing
  // phone is not blocked. Correcting a dni is an admin action
  // (adminUpdateUser).
  async completeProfile(id: number, dto: CompleteProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
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
      throw new NotFoundException(`El usuario con ID: ${id} no existe.`);
    }

    if (user.dni == null) {
      if (dto.dni == null) {
        throw new BadRequestException('El DNI es obligatorio.');
      }

      const dniTaken = await this.findUserByDni(dto.dni);
      if (dniTaken) {
        throw new ConflictException(
          `El DNI ${dto.dni} ya está registrado en otra cuenta. Acercate al gimnasio para resolverlo.`,
        );
      }

      user.dni = dto.dni;
    }

    user.phone = dto.phone.trim();

    return await this.usersRepository.save(user);
  }
}
