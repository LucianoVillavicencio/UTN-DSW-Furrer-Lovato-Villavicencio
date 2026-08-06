import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { InscripcionClase } from './entity/inscripcion-clase.entity';
import { TurnoClase } from '../turno-clase/entity/turno-clase.entity';
import { InscripcionClaseDto } from './dto/inscripcion-clase-dto';

@Injectable()
export class InscripcionClaseService {
  constructor(
    @InjectRepository(InscripcionClase)
    private inscripcionClaseRepository: Repository<InscripcionClase>,
    @InjectRepository(TurnoClase)
    private turnoClaseRepository: Repository<TurnoClase>,
  ) {}

  async createInscripcionClase(inscripcionDto: InscripcionClaseDto) {
    const existing = await this.inscripcionClaseRepository.findOne({
      where: {
        userDni: inscripcionDto.userDni,
        turnoClaseId: inscripcionDto.turnoClaseId,
        deleted: false,
      },
    });
    if (existing) {
      throw new ConflictException('Ya estás inscripto a esta clase.');
    }

    const turno = await this.turnoClaseRepository.findOne({
      where: { id: inscripcionDto.turnoClaseId, deleted: false },
    });
    if (!turno) {
      throw new NotFoundException('El turno de clase especificado no existe.');
    }
    if (turno.cupoDisponible <= 0) {
      throw new ConflictException('No quedan cupos disponibles para esta clase.');
    }

    const newInscripcion = this.inscripcionClaseRepository.create({
      ...inscripcionDto,
      fechaInscripcion: inscripcionDto.fechaInscripcion
        ? new Date(inscripcionDto.fechaInscripcion)
        : new Date(),
      estado: inscripcionDto.estado ?? 'confirmada',
      deleted: inscripcionDto.deleted ?? false,
    });

    const savedInscripcion = await this.inscripcionClaseRepository.save(newInscripcion);

    turno.cupoDisponible = Math.max(0, turno.cupoDisponible - 1);
    await this.turnoClaseRepository.save(turno);

    return savedInscripcion;
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

    const turno = await this.turnoClaseRepository.findOne({
      where: { id: exists.turnoClaseId },
    });
    if (turno) {
      turno.cupoDisponible = Math.min(turno.cupoMaximo, turno.cupoDisponible + 1);
      await this.turnoClaseRepository.save(turno);
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

