import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Suscripcion } from './entity/suscripcion.entity';
import { SuscripcionDto } from './dto/suscripcion-dto';

@Injectable()
export class SuscripcionService {
  constructor(
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
  ) {}

  async createSuscripcion(suscripcionDto: SuscripcionDto) {
    const newSuscripcion = this.suscripcionRepository.create({
      ...suscripcionDto,
      fechaInicio: new Date(suscripcionDto.fechaInicio),
      fechaFin: new Date(suscripcionDto.fechaFin),
      estado: suscripcionDto.estado ?? 'activa',
      deleted: suscripcionDto.deleted ?? false,
    });
    return await this.suscripcionRepository.save(newSuscripcion);
  }

  async findSuscripcion(id: number) {
    return await this.suscripcionRepository.findOne({
      where: { id },
      relations: { user: true, plan: true },
    });
  }

  async findAll() {
    return await this.suscripcionRepository.find({
      where: { deleted: false },
      relations: { user: true, plan: true },
    });
  }

  async findAllDeleted() {
    return await this.suscripcionRepository.find({
      where: { deleted: true },
      relations: { user: true, plan: true },
    });
  }

  async updateSuscripcion(suscripcionDto: SuscripcionDto) {
    if (!suscripcionDto.id) {
      throw new ConflictException('El ID de la suscripción es obligatorio para actualizar.');
    }
    const exists = await this.findSuscripcion(suscripcionDto.id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${suscripcionDto.id} no existe.`);
    }
    const updatedSuscripcion = {
      ...suscripcionDto,
      fechaInicio: suscripcionDto.fechaInicio ? new Date(suscripcionDto.fechaInicio) : exists.fechaInicio,
      fechaFin: suscripcionDto.fechaFin ? new Date(suscripcionDto.fechaFin) : exists.fechaFin,
    };
    return await this.suscripcionRepository.save(updatedSuscripcion);
  }

  async deleteSuscripcion(id: number) {
    const exists = await this.findSuscripcion(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La suscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.suscripcionRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreSuscripcion(id: number) {
    const exists = await this.findSuscripcion(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La suscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.suscripcionRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
