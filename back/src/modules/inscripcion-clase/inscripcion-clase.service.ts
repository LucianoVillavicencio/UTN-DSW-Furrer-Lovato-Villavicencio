import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { InscripcionClase } from './entity/inscripcion-clase.entity';
import { InscripcionClaseDto } from './dto/inscripcion-clase-dto';

@Injectable()
export class InscripcionClaseService {
  constructor(
    @InjectRepository(InscripcionClase)
    private inscripcionClaseRepository: Repository<InscripcionClase>,
  ) {}

  async createInscripcionClase(inscripcionDto: InscripcionClaseDto) {
    const newInscripcion = this.inscripcionClaseRepository.create({
      ...inscripcionDto,
      fechaInscripcion: inscripcionDto.fechaInscripcion
        ? new Date(inscripcionDto.fechaInscripcion)
        : new Date(),
      estado: inscripcionDto.estado ?? 'confirmada',
      deleted: inscripcionDto.deleted ?? false,
    });
    return await this.inscripcionClaseRepository.save(newInscripcion);
  }

  async findInscripcionClase(id: number) {
    return await this.inscripcionClaseRepository.findOne({
      where: { id },
      relations: { user: true, turnoClase: true },
    });
  }

  async findAll() {
    return await this.inscripcionClaseRepository.find({
      where: { deleted: false },
      relations: { user: true, turnoClase: true },
    });
  }

  async findAllDeleted() {
    return await this.inscripcionClaseRepository.find({
      where: { deleted: true },
      relations: { user: true, turnoClase: true },
    });
  }

  async updateInscripcionClase(inscripcionDto: InscripcionClaseDto) {
    if (!inscripcionDto.id) {
      throw new ConflictException('El ID de la inscripción es obligatorio para actualizar.');
    }
    const exists = await this.findInscripcionClase(inscripcionDto.id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${inscripcionDto.id} no existe.`);
    }
    const updatedInscripcion = {
      ...inscripcionDto,
      fechaInscripcion: inscripcionDto.fechaInscripcion
        ? new Date(inscripcionDto.fechaInscripcion)
        : exists.fechaInscripcion,
    };
    return await this.inscripcionClaseRepository.save(updatedInscripcion);
  }

  async deleteInscripcionClase(id: number) {
    const exists = await this.findInscripcionClase(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La inscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.inscripcionClaseRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreInscripcionClase(id: number) {
    const exists = await this.findInscripcionClase(id);
    if (!exists) {
      throw new NotFoundException(`La inscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La inscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.inscripcionClaseRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
