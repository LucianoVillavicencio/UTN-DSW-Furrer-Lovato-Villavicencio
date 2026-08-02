import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Clase } from './entity/clase.entity';
import { ClaseDto } from './dto/clase-dto';

@Injectable()
export class ClaseService {
  constructor(
    @InjectRepository(Clase)
    private claseRepository: Repository<Clase>,
  ) {}

  async createClase(claseDto: ClaseDto) {
    const newClase = this.claseRepository.create({
      ...claseDto,
      deleted: claseDto.deleted ?? false,
    });
    return await this.claseRepository.save(newClase);
  }

  async findClase(id: number) {
    return await this.claseRepository.findOne({
      where: { id },
      relations: { tipoClase: true, profesor: true },
    });
  }

  async findAll() {
    return await this.claseRepository.find({
      where: { deleted: false },
      relations: { tipoClase: true, profesor: true },
    });
  }

  async findAllDeleted() {
    return await this.claseRepository.find({
      where: { deleted: true },
      relations: { tipoClase: true, profesor: true },
    });
  }

  async updateClase(claseDto: ClaseDto) {
    if (!claseDto.id) {
      throw new ConflictException('El ID de la clase es obligatorio para actualizar.');
    }
    const exists = await this.findClase(claseDto.id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${claseDto.id} no existe.`);
    }
    return await this.claseRepository.save(claseDto);
  }

  async deleteClase(id: number) {
    const exists = await this.findClase(id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La clase ya está eliminada.`);
    }
    const rows: UpdateResult = await this.claseRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreClase(id: number) {
    const exists = await this.findClase(id);
    if (!exists) {
      throw new NotFoundException(`La clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La clase no está borrada.`);
    }
    const rows: UpdateResult = await this.claseRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
