import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Class } from './entity/class.entity';
import { ClassDto } from './dto/class-dto';
import { ClassSessionService } from '../classSession/classSession.service';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private readonly classSessionService: ClassSessionService,
  ) {}

  async createClass(classDto: ClassDto) {
    const newClass = this.classRepository.create({
      ...classDto,
      deleted: classDto.deleted ?? false,
    });
    return await this.classRepository.save(newClass);
  }

  async findClass(id: number) {
    return await this.classRepository.findOne({
      where: { id },
      relations: { typeClass: true, trainer: true },
    });
  }

  async findAll() {
    return await this.classRepository.find({
      where: { deleted: false },
      relations: { typeClass: true, trainer: true },
    });
  }

  async findAllDeleted() {
    return await this.classRepository.find({
      where: { deleted: true },
      relations: { typeClass: true, trainer: true },
    });
  }

  async updateClass(classDto: ClassDto) {
    if (!classDto.id) {
      throw new ConflictException(
        'El ID de la clase es obligatorio para actualizar.',
      );
    }
    const exists = await this.findClass(classDto.id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${classDto.id} no existe.`);
    }
    return await this.classRepository.save(classDto);
  }

  async deleteClass(id: number) {
    const exists = await this.findClass(id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La clase ya está eliminada.`);
    }
    const rows: UpdateResult = await this.classRepository.update(
      { id },
      { deleted: true },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la clase`);
    }

    // A deleted class cannot keep offering turnos — leaving them behind is
    // what let a deleted class's schedule keep showing up as if it were live.
    await this.classSessionService.deleteAllOfClass(id);

    return { message: `Eliminada correctamente` };
  }

  async restoreClass(id: number) {
    const exists = await this.findClass(id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La clase no está borrada.`);
    }
    const rows: UpdateResult = await this.classRepository.update(
      { id },
      { deleted: false },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la clase`);
    }

    // Undoes the cascade from deleteClass: the turnos come back with the class.
    await this.classSessionService.restoreAllOfClass(id);

    return { message: `Restaurada correctamente` };
  }
}
