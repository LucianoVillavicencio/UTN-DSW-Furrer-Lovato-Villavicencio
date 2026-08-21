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
import { UpdateProfileDto } from './dto/update-profile-dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import { Role } from '../../common/enum/rol.enum';
import * as bcrypt from 'bcrypt';

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

  // Búsqueda para el admin: dni y email hacen match exacto, name/surname
  // hacen LIKE parcial. Cada filtro es independiente (se puede buscar por
  // uno solo); si no viene ninguno, se comporta como findAll().
  async searchUsers(query: {
    dni?: number;
    email?: string;
    name?: string;
    surname?: string;
  }) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      // select:false en la entity no lo respeta QueryBuilder (a diferencia
      // de Repository.find/findOne) — se listan las columnas a mano para
      // no arriesgarse a devolver el hash de la contraseña.
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

    // password tiene select:false en la entity, así que no hace falta
    // excluirlo a mano acá: TypeORM no lo trae salvo que se pida explícito.
    return qb.orderBy('user.name', 'ASC').take(50).getMany();
  }

  // Get Users deleted
  async findAllDeleted() {
    return await this.usersRepository.find({ where: { deleted: true } });
  }

  // Self-service profile update. dni siempre viene del JWT (ver
  // UserController#updateMyProfile), nunca del body: así un usuario no
  // puede editar el registro de otro usuario aunque lo intente.
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

  // Edición por parte de un admin (panel de Usuarios): a diferencia de
  // updateUsers (PUT /user, UsersDto) no toca password, así que no hay
  // riesgo de guardar un valor sin hashear.
  async adminUpdateUser(dni: number, dto: AdminUpdateUserDto) {
    // select explícito con password incluido (igual que updateProfile):
    // si se omite, save() de una entity a la que le falta esa columna
    // puede terminar pisándola con null.
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