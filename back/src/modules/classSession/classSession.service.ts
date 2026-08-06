import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { ClassSession } from './entity/classSession.entity';
import { ClassSessionDto } from './dto/classSession-dto';

@Injectable()
export class ClassSessionService {
  constructor(
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
  ) {}

  async createClassSession(classSessionDto: ClassSessionDto) {
    const newSession = this.classSessionRepository.create({
      ...classSessionDto,
      dateTime: new Date(classSessionDto.dateTime),
      availableSpots:
        classSessionDto.availableSpots ?? classSessionDto.maxCapacity,
      deleted: classSessionDto.deleted ?? false,
    });
    return await this.classSessionRepository.save(newSession);
  }

  async findClassSession(id: number) {
    return await this.classSessionRepository.findOne({
      where: { id },
      relations: { class: true },
    });
  }

  async findAll() {
    return await this.classSessionRepository.find({
      where: { deleted: false },
      relations: { class: true },
    });
  }

  async findAllDeleted() {
    return await this.classSessionRepository.find({
      where: { deleted: true },
      relations: { class: true },
    });
  }

  async updateClassSession(classSessionDto: ClassSessionDto) {
    if (!classSessionDto.id) {
      throw new ConflictException(
        'El ID del turno de clase es obligatorio para actualizar.',
      );
    }
    const exists = await this.findClassSession(classSessionDto.id);
    if (!exists) {
      throw new NotFoundException(
        `El turno de clase con ID: ${classSessionDto.id} no existe.`,
      );
    }
    const updatedClassSession = {
      ...classSessionDto,
      dateTime: classSessionDto.dateTime
        ? new Date(classSessionDto.dateTime)
        : exists.dateTime,
    };
    return await this.classSessionRepository.save(updatedClassSession);
  }

  async deleteClassSession(id: number) {
    const exists = await this.findClassSession(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El turno de clase ya está eliminado.`);
    }
    const rows: UpdateResult = await this.classSessionRepository.update(
      { id },
      { deleted: true },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el turno de clase`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreClassSession(id: number) {
    const exists = await this.findClassSession(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El turno de clase no está eliminado.`);
    }
    const rows: UpdateResult = await this.classSessionRepository.update(
      { id },
      { deleted: false },
    );

    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el turno de clase`);
    }

    return { message: `Restaurado correctamente` };
  }
}
