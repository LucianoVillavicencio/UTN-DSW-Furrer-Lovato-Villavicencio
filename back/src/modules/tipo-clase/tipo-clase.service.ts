import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TipoClase } from './entity/tipo-clase.entity';
import { TipoClaseDto } from './dto/tipo-clase-dto';

@Injectable()
export class TipoClaseService {
  constructor(
    @InjectRepository(TipoClase)
    private tipoClaseRepository: Repository<TipoClase>,
  ) {}

  async createTipoClase(tipoClaseDto: TipoClaseDto) {
    const newTipo = this.tipoClaseRepository.create({
      ...tipoClaseDto,
      deleted: tipoClaseDto.deleted ?? false,
    });
    return await this.tipoClaseRepository.save(newTipo);
  }

  async findTipoClase(id: number) {
    return await this.tipoClaseRepository.findOne({ where: { id } });
  }

  async findAll() {
    return await this.tipoClaseRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.tipoClaseRepository.find({ where: { deleted: true } });
  }

  async updateTipoClase(tipoClaseDto: TipoClaseDto) {
    if (!tipoClaseDto.id) {
      throw new ConflictException('El ID del tipo de clase es obligatorio para actualizar.');
    }
    const exists = await this.findTipoClase(tipoClaseDto.id);
    if (!exists) {
      throw new NotFoundException(`El tipo de clase con ID: ${tipoClaseDto.id} no existe.`);
    }
    return await this.tipoClaseRepository.save(tipoClaseDto);
  }

  async deleteTipoClase(id: number) {
    const exists = await this.findTipoClase(id);
    if (!exists) {
      throw new NotFoundException(`El tipo de clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El tipo de clase ya está eliminado.`);
    }
    const rows: UpdateResult = await this.tipoClaseRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreTipoClase(id: number) {
    const exists = await this.findTipoClase(id);
    if (!exists) {
      throw new NotFoundException(`El tipo de clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El tipo de clase no está borrado.`);
    }
    const rows: UpdateResult = await this.tipoClaseRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
