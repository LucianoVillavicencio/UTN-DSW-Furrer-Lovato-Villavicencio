import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Trainer } from './entity/trainer.entity';
import { TrainerDto } from './dto/trainer-dto';

@Injectable()
export class TrainerService {
  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
  ) {}

  async createTrainer(trainerDto: TrainerDto) {
    const exists = await this.findTrainer(trainerDto.dni);
    if (exists) {
      throw new ConflictException(
        `El profesor con DNI: ${trainerDto.dni} ya existe.`,
      );
    }
    const newTrainer = this.trainerRepository.create({
      ...trainerDto,
      deleted: trainerDto.deleted ?? false,
    });
    return await this.trainerRepository.save(newTrainer);
  }

  async findTrainer(dni: number) {
    return await this.trainerRepository.findOne({ where: { dni } });
  }

  async findAll() {
    return await this.trainerRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.trainerRepository.find({ where: { deleted: true } });
  }

  async updateTrainer(TrainerDto: TrainerDto) {
    const exists = await this.findTrainer(TrainerDto.dni);
    if (!exists) {
      throw new NotFoundException(
        `El profesor con DNI: ${TrainerDto.dni} no existe.`,
      );
    }
    return await this.trainerRepository.save(TrainerDto);
  }

  async deleteTrainer(dni: number) {
    const exists = await this.findTrainer(dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El profesor ya está eliminado.`);
    }
    const rows: UpdateResult = await this.trainerRepository.update(
      { dni },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el profesor`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreTrainer(dni: number) {
    const exists = await this.findTrainer(dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El profesor no está borrado.`);
    }
    const rows: UpdateResult = await this.trainerRepository.update(
      { dni },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el profesor`);
    }

    return { message: `Restaurado correctamente` };
  }
}
