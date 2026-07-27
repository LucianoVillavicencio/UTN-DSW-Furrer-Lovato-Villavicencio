import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { Repository } from 'typeorm';
import { UsersDto } from './dto/users-dto';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  async createUsers(user: UsersDto) {
    const userExists = await this.findUser(user.dni);

    if (userExists) {
      throw new ConflictException(
        'El usuario con DNI: ' + user.dni + 'existe.',
      );
    } else {
      return await this.usersRepository.save(user);
    }
  }

  // Find One User

  async findUser(dni: number) {
    return await this.usersRepository.findOne({ where: { dni } });
  }

  // Find all User

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
      throw new ConflictException(`El usuario con DNI : ${dni} no existe.`);
    }

    if (userExists.deleted) {
      throw new ConflictException(`El usuario ya esta eliminado.`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { dni },
      { deleted: true },
    );

    return rows.affected == 1;
  }

  // Restore User
  async restoreUsers(dni: number) {
    const userExists = await this.findUser(dni);

    if (!userExists) {
      throw new ConflictException(`El usuario con DNI: ${dni} no existe`);
    }

    if (!userExists.deleted) {
      throw new ConflictException(`El usuario no esta borrado`);
    }

    const rows: UpdateResult = await this.usersRepository.update(
      { dni },
      { deleted: false },
    );

    return rows.affected == 1;
  }
}
