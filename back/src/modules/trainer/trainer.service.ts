import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Trainer } from './entity/trainer.entity';
import { TrainerDto } from './dto/trainer-dto';
import { findWorkScheduleError } from './trainer.rules';

@Injectable()
export class TrainerService {
  private readonly logger = new Logger(TrainerService.name);

  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
  ) {}

  private assertValidWorkSchedule(trainerDto: TrainerDto): void {
    const error = findWorkScheduleError(trainerDto.workSchedule ?? []);
    if (error) {
      throw new BadRequestException(error);
    }
  }

  async createTrainer(trainerDto: TrainerDto) {
    const exists = await this.findTrainer(trainerDto.dni);
    if (exists) {
      throw new ConflictException(
        `El profesor con DNI: ${trainerDto.dni} ya existe.`,
      );
    }
    this.assertValidWorkSchedule(trainerDto);
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

  async updateTrainer(trainerDto: TrainerDto) {
    const exists = await this.findTrainer(trainerDto.dni);
    if (!exists) {
      throw new NotFoundException(
        `El profesor con DNI: ${trainerDto.dni} no existe.`,
      );
    }
    this.assertValidWorkSchedule(trainerDto);
    // Merged onto the stored row rather than saved on its own: photoUrl is not
    // part of the DTO, so saving the DTO alone would drop the photo.
    return await this.trainerRepository.save({ ...exists, ...trainerDto });
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
