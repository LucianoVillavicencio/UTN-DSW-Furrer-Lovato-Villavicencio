import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Profesor } from './entity/profesor.entity';
import { ProfesorDto } from './dto/profesor-dto';

@Injectable()
export class ProfesorService {
  constructor(
    @InjectRepository(Profesor)
    private profesorRepository: Repository<Profesor>,
  ) {}

  async createProfesor(profesorDto: ProfesorDto) {
    const exists = await this.findProfesor(profesorDto.dni);
    if (exists) {
      throw new ConflictException(`El profesor con DNI: ${profesorDto.dni} ya existe.`);
    }
    const newProfesor = this.profesorRepository.create({
      ...profesorDto,
      deleted: profesorDto.deleted ?? false,
    });
    return await this.profesorRepository.save(newProfesor);
  }

  async findProfesor(dni: number) {
    return await this.profesorRepository.findOne({ where: { dni } });
  }

  async findAll() {
    return await this.profesorRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.profesorRepository.find({ where: { deleted: true } });
  }

  async updateProfesor(profesorDto: ProfesorDto) {
    const exists = await this.findProfesor(profesorDto.dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${profesorDto.dni} no existe.`);
    }
    return await this.profesorRepository.save(profesorDto);
  }

  async deleteProfesor(dni: number) {
    const exists = await this.findProfesor(dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El profesor ya está eliminado.`);
    }
    const rows: UpdateResult = await this.profesorRepository.update(
      { dni },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restoreProfesor(dni: number) {
    const exists = await this.findProfesor(dni);
    if (!exists) {
      throw new NotFoundException(`El profesor con DNI: ${dni} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El profesor no está borrado.`);
    }
    const rows: UpdateResult = await this.profesorRepository.update(
      { dni },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
