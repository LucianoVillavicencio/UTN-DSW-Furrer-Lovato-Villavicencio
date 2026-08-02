import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TurnoClase } from './entity/turno-clase.entity';
import { TurnoClaseDto } from './dto/turno-clase-dto';

@Injectable()
export class TurnoClaseService {
  constructor(
    @InjectRepository(TurnoClase)
    private turnoClaseRepository: Repository<TurnoClase>,
  ) {}

  async createTurnoClase(turnoClaseDto: TurnoClaseDto) {
    const newTurno = this.turnoClaseRepository.create({
      ...turnoClaseDto,
      fechaHora: new Date(turnoClaseDto.fechaHora),
      cupoDisponible: turnoClaseDto.cupoDisponible ?? turnoClaseDto.cupoMaximo,
      deleted: turnoClaseDto.deleted ?? false,
    });
    return await this.turnoClaseRepository.save(newTurno);
  }

  async findTurnoClase(id: number) {
    return await this.turnoClaseRepository.findOne({
      where: { id },
      relations: { clase: true },
    });
  }

  async findAll() {
    return await this.turnoClaseRepository.find({
      where: { deleted: false },
      relations: { clase: true },
    });
  }

  async findAllDeleted() {
    return await this.turnoClaseRepository.find({
      where: { deleted: true },
      relations: { clase: true },
    });
  }

  async updateTurnoClase(turnoClaseDto: TurnoClaseDto) {
    if (!turnoClaseDto.id) {
      throw new ConflictException('El ID del turno de clase es obligatorio para actualizar.');
    }
    const exists = await this.findTurnoClase(turnoClaseDto.id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${turnoClaseDto.id} no existe.`);
    }
    const updatedTurno = {
      ...turnoClaseDto,
      fechaHora: turnoClaseDto.fechaHora ? new Date(turnoClaseDto.fechaHora) : exists.fechaHora,
    };
    return await this.turnoClaseRepository.save(updatedTurno);
  }

  async deleteTurnoClase(id: number) {
    const exists = await this.findTurnoClase(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El turno de clase ya está eliminado.`);
    }
    const rows: UpdateResult = await this.turnoClaseRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreTurnoClase(id: number) {
    const exists = await this.findTurnoClase(id);
    if (!exists) {
      throw new NotFoundException(`El turno de clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El turno de clase no está borrado.`);
    }
    const rows: UpdateResult = await this.turnoClaseRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
