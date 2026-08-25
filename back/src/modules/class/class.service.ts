import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, Repository, UpdateResult } from 'typeorm';
import { Class } from './entity/class.entity';
import { ClassDto } from './dto/class-dto';
import { ClassSessionService } from '../classSession/classSession.service';
import { publicTrainerSelect } from '../trainer/trainer-projection';

// The joined trainer relation must not leak email/phone through these
// methods (GET /class and GET /class/:id are both public routes, and the
// admin ClassesSection panel matches trainers by trainerDni against its own
// separate trainer fetch — it never reads .trainer.* off a Class). TypeORM's
// select is a whitelist: every Class column needed elsewhere has to be listed
// here too, or it silently drops out the same way the entity's own eager flag
// no longer helps once a relation is requested explicitly.
const classSelect: FindOptionsSelect<Class> = {
  id: true,
  name: true,
  description: true,
  typeClassId: true,
  typeClass: true,
  trainerDni: true,
  trainer: publicTrainerSelect,
  deleted: true,
};

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
      select: classSelect,
    });
  }

  async findAll() {
    return await this.classRepository.find({
      where: { deleted: false },
      relations: { typeClass: true, trainer: true },
      select: classSelect,
    });
  }

  async findAllDeleted() {
    return await this.classRepository.find({
      where: { deleted: true },
      relations: { typeClass: true, trainer: true },
      select: classSelect,
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
