import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeClass } from './entity/typeClass.entity';
import { TypeClassDto } from './dto/typeClass-dto';
@Injectable()
export class TypeClassService {
  constructor(
    @InjectRepository(TypeClass)
    private typeClassRepository: Repository<TypeClass>,
  ) {}

  async createTypeClass(typeClassDto: TypeClassDto) {
    const existing = await this.findByName(typeClassDto.name);
    if (existing) {
      throw new ConflictException(
        `El tipo de clase "${typeClassDto.name}" ya existe.`,
      );
    }
    const newType = this.typeClassRepository.create({
      ...typeClassDto,
      deleted: typeClassDto.deleted ?? false,
    });
    return await this.typeClassRepository.save(newType);
  }

  // Case-insensitive: "Funcional" and "funcional" are the same discipline to
  // an admin typing it into the quick-add field, and letting both through
  // produced two live "Funcional" rows in the type selector.
  private async findByName(name: string) {
    return await this.typeClassRepository
      .createQueryBuilder('typeClass')
      .where('LOWER(typeClass.name) = LOWER(:name)', { name })
      .andWhere('typeClass.deleted = false')
      .getOne();
  }

  async findTypeClass(id: number) {
    return await this.typeClassRepository.findOne({ where: { id } });
  }

  async findAll() {
    return await this.typeClassRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.typeClassRepository.find({ where: { deleted: true } });
  }

  async updateTypeClass(typeClassDto: TypeClassDto) {
    if (!typeClassDto.id) {
      throw new ConflictException(
        'El ID del tipo de clase es obligatorio para actualizar.',
      );
    }
    const exists = await this.findTypeClass(typeClassDto.id);
    if (!exists) {
      throw new NotFoundException(
        `El tipo de clase con ID: ${typeClassDto.id} no existe.`,
      );
    }
    return await this.typeClassRepository.save(typeClassDto);
  }

  async deleteTypeClass(id: number) {
    const exists = await this.findTypeClass(id);
    if (!exists) {
      throw new NotFoundException(`El tipo de clase con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El tipo de clase ya está eliminado.`);
    }
    const rows: UpdateResult = await this.typeClassRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el tipo de clase`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreTypeClass(id: number) {
    const exists = await this.findTypeClass(id);
    if (!exists) {
      throw new NotFoundException(`El tipo de clase con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El tipo de clase no está borrado.`);
    }
    const rows: UpdateResult = await this.typeClassRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el tipo de clase`);
    }

    return { message: `Restaurado correctamente` };
  }
}
