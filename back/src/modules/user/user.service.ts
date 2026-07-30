import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { Repository, UpdateResult } from 'typeorm';
import { LoginDto, UsersDto } from './dto/users-dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

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
