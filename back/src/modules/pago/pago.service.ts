import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Pago } from './entity/pago.entity';
import { PagoDto } from './dto/pago-dto';

@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
  ) {}

  async createPago(pagoDto: PagoDto) {
    const newPago = this.pagoRepository.create({
      ...pagoDto,
      fechaPago: new Date(pagoDto.fechaPago),
      estado: pagoDto.estado ?? 'completado',
      deleted: pagoDto.deleted ?? false,
    });
    return await this.pagoRepository.save(newPago);
  }

  async findPago(id: number) {
    return await this.pagoRepository.findOne({
      where: { id },
      relations: { suscripcion: true },
    });
  }

  async findAll() {
    return await this.pagoRepository.find({
      where: { deleted: false },
      relations: { suscripcion: true },
    });
  }

  async findAllDeleted() {
    return await this.pagoRepository.find({
      where: { deleted: true },
      relations: { suscripcion: true },
    });
  }

  async updatePago(pagoDto: PagoDto) {
    if (!pagoDto.id) {
      throw new ConflictException('El ID del pago es obligatorio para actualizar.');
    }
    const exists = await this.findPago(pagoDto.id);
    if (!exists) {
      throw new NotFoundException(`El pago con ID: ${pagoDto.id} no existe.`);
    }
    const updatedPago = {
      ...pagoDto,
      fechaPago: pagoDto.fechaPago ? new Date(pagoDto.fechaPago) : exists.fechaPago,
    };
    return await this.pagoRepository.save(updatedPago);
  }

  async deletePago(id: number) {
    const exists = await this.findPago(id);
    if (!exists) {
      throw new NotFoundException(`El pago con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El pago ya está eliminado.`);
    }
    const rows: UpdateResult = await this.pagoRepository.update(
      { id },
      { deleted: true },
    );
    return rows.affected === 1;
  }

  async restorePago(id: number) {
    const exists = await this.findPago(id);
    if (!exists) {
      throw new NotFoundException(`El pago con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El pago no está borrado.`);
    }
    const rows: UpdateResult = await this.pagoRepository.update(
      { id },
      { deleted: false },
    );
    return rows.affected === 1;
  }
}
