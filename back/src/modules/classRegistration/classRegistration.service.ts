import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { ClassRegistration } from './entity/classRegistration.entity';
import { ClassRegistrationDto } from './dto/classRegistration-dto';
import { ClassRegistrationState } from './enum/classRegistration-state.enum';

@Injectable()
export class ClassRegistrationService {
  constructor(
    @InjectRepository(ClassRegistration)
    private classRegistrationRepository: Repository<ClassRegistration>,
  ) {}

  async createClassRegistration(classRegistration: ClassRegistrationDto) {
    const newRegistration = this.classRegistrationRepository.create({
      ...classRegistration,
      date: classRegistration.date
        ? new Date(classRegistration.date)
        : new Date(),
      state: classRegistration.state ?? ClassRegistrationState.CONFIRMED,
      deleted: classRegistration.deleted ?? false,
    });
    return await this.classRegistrationRepository.save(newRegistration);
  }

  async findClassRegistration(id: number) {
    return await this.classRegistrationRepository.findOne({
      where: { id },
      relations: { user: true, classSession: true },
    });
  }

  async findAll() {
    return await this.classRegistrationRepository.find({
      where: { deleted: false },
      relations: { user: true, classSession: true },
    });
  }

  async findAllDeleted() {
    return await this.classRegistrationRepository.find({
      where: { deleted: true },
      relations: { user: true, classSession: true },
    });
  }

  async updateClassRegistration(classRegistration: ClassRegistrationDto) {
    if (!classRegistration.id) {
      throw new ConflictException(
        'El ID de la inscripción es obligatorio para actualizar.',
      );
    }
    const exists = await this.findClassRegistration(classRegistration.id);
    if (!exists) {
      throw new NotFoundException(
        `La inscripción con ID: ${classRegistration.id} no existe.`,
      );
    }
    const updatedClassRegistration = {
      ...classRegistration,
      date: classRegistration.date
        ? new Date(classRegistration.date)
        : exists.date,
    };
    return await this.classRegistrationRepository.save(
      updatedClassRegistration,
    );
  }

  async deleteClassRegistration(id: number) {
    const exists = await this.findClassRegistration(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La inscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.classRegistrationRepository.update(
      { id },
      { deleted: true },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la inscripcion`);
    }

    return { message: `Eliminada correctamente` };
  }

  async restoreClassRegistration(id: number) {
    const exists = await this.findClassRegistration(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La inscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.classRegistrationRepository.update(
      { id },
      { deleted: false },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la inscripcion`);
    }

    return { message: `Restaurada correctamente` };
  }
}
