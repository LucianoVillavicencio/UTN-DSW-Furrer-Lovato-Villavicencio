import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Trainer } from './entity/trainer.entity';
import type {
  Trainer as TrainerEntity,
  TrainerClass,
} from './entity/trainer.entity';
import { TrainerDto } from './dto/trainer-dto';
import { findWorkScheduleError, toTrainerClasses } from './trainer.rules';
import {
  TRAINER_PHOTO_DIRECTORY,
  trainerPhotoPublicPath,
} from './trainer-photo.config';
import { ClassService } from '../class/class.service';
import { publicTrainerSelect } from './trainer-projection';

// Re-exported so callers (and this module's own test) can keep importing it
// from './trainer.service' — the projection itself lives in
// './trainer-projection' to avoid a circular import with class.service.ts.
export { publicTrainerSelect };

type TrainerWithClasses = TrainerEntity & { classes: TrainerClass[] };

@Injectable()
export class TrainerService {
  private readonly logger = new Logger(TrainerService.name);

  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    private readonly classService: ClassService,
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

  // Full entity. Used internally by the mutation methods below for their
  // existence checks and (in updateTrainer's case) a merge, and by the
  // admin-only findTrainer route — never by a public one.
  async findTrainer(dni: number) {
    return await this.trainerRepository.findOne({ where: { dni } });
  }

  // Public projection of the same lookup, for findTrainerWithClasses
  // (GET /trainer/:dni, unauthenticated).
  private async findPublicTrainer(dni: number) {
    return await this.trainerRepository.findOne({
      where: { dni },
      select: publicTrainerSelect,
    });
  }

  // Public projection: GET /trainer is unauthenticated.
  async findAll() {
    return await this.trainerRepository.find({
      where: { deleted: false },
      select: publicTrainerSelect,
    });
  }

  // Full entity: GET /trainer/filter/deleted is ADMIN-only.
  async findAllDeleted() {
    return await this.trainerRepository.find({ where: { deleted: true } });
  }

  // Full entity, ADMIN-only: the admin Trainers panel edits an entry straight
  // out of this list (no separate per-trainer fetch), so it needs email and
  // phone here rather than through the public findAll()/GET /trainer.
  async findAllForAdmin() {
    return await this.trainerRepository.find({ where: { deleted: false } });
  }

  async findAllWithClasses(): Promise<TrainerWithClasses[]> {
    const trainers = await this.findAll();
    return await this.attachClasses(trainers);
  }

  async findTrainerWithClasses(dni: number): Promise<TrainerWithClasses> {
    const trainer = await this.findPublicTrainer(dni);
    if (!trainer) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    const [withClasses] = await this.attachClasses([trainer]);
    return withClasses;
  }

  // One query for the whole listing, never one per trainer.
  private async attachClasses(
    trainers: Trainer[],
  ): Promise<TrainerWithClasses[]> {
    if (trainers.length === 0) {
      return [];
    }
    const classes = await this.classService.findAll();
    return trainers.map((trainer) => ({
      ...trainer,
      classes: toTrainerClasses(classes, trainer.dni),
    }));
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

  async setTrainerPhoto(dni: number, filename: string) {
    const exists = await this.findTrainer(dni);
    if (!exists) {
      // The controller has already written the file to disk, so it has to go
      // before we bail out.
      await this.removePhotoFile(trainerPhotoPublicPath(filename));
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }

    const previous = exists.photoUrl;
    await this.trainerRepository.update(
      { dni },
      { photoUrl: trainerPhotoPublicPath(filename) },
    );
    await this.removePhotoFile(previous);

    return await this.findTrainer(dni);
  }

  async removeTrainerPhoto(dni: number) {
    const exists = await this.findTrainer(dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    if (!exists.photoUrl) {
      throw new ConflictException(`El profesor no tiene una foto cargada.`);
    }

    await this.trainerRepository.update({ dni }, { photoUrl: null });
    await this.removePhotoFile(exists.photoUrl);

    return { message: `Foto eliminada correctamente` };
  }

  private async removePhotoFile(photoUrl?: string | null): Promise<void> {
    if (!photoUrl) {
      return;
    }
    // basename() only: the column is ours, but reading a path from the database
    // and joining it raw is how a traversal gets in later.
    const filename = basename(photoUrl);
    try {
      await unlink(join(TRAINER_PHOTO_DIRECTORY, filename));
    } catch (error) {
      // Tolerated: the row already points at the new photo, so a leftover file
      // only wastes disk and must not fail the request.
      this.logger.warn(
        `Stale trainer photo not removed: ${filename}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
