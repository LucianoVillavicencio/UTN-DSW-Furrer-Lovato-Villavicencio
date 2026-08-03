import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { SubscriptionDto } from './dto/subscription-dto';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state-enum';

@Injectable()
export class subscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async createSubscription(subscriptionDto: SubscriptionDto) {
    const newSubscription = this.subscriptionRepository.create({
      ...subscriptionDto,
      startDate: new Date(subscriptionDto.startDate),
      endDate: new Date(subscriptionDto.endDate),
      state: subscriptionDto.state ?? SubscriptionState.ACTIVE,
      deleted: subscriptionDto.deleted ?? false,
    });
    return await this.subscriptionRepository.save(newSubscription);
  }

  async findSubscription(id: number) {
    return await this.subscriptionRepository.findOne({
      where: { id },
      relations: { user: true, plan: true },
    });
  }

  async findAll() {
    return await this.subscriptionRepository.find({
      where: { deleted: false },
      relations: { user: true, plan: true },
    });
  }

  async findAllDeleted() {
    return await this.subscriptionRepository.find({
      where: { deleted: true },
      relations: { user: true, plan: true },
    });
  }

  async updateSubscription(subscriptionDto: SubscriptionDto) {
    if (!subscriptionDto.id) {
      throw new ConflictException(
        'El ID de la suscripción es obligatorio para actualizar.',
      );
    }
    const exists = await this.findSubscription(subscriptionDto.id);
    if (!exists) {
      throw new NotFoundException(
        `La suscripción con ID: ${subscriptionDto.id} no existe.`,
      );
    }
    const updatedsubscription = {
      ...subscriptionDto,
      startDate: subscriptionDto.startDate
        ? new Date(subscriptionDto.startDate)
        : exists.startDate,
      endDate: subscriptionDto.endDate
        ? new Date(subscriptionDto.endDate)
        : exists.endDate,
    };
    return await this.subscriptionRepository.save(updatedsubscription);
  }

  async deleteSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La suscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la suscripcion`);
    }

    return { message: `Eliminada correctamente` };
  }
  async restoreSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La suscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la suscripcion`);
    }

    return { message: `Restaurada correctamente` };
  }
}
