import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Payment } from './entity/payment.entity';
import { PaymentDto } from './dto/payment-dto';
import { ManualPaymentDto } from './dto/manual-payment-dto';
import { PaymentState } from './enum/payment-state.enum';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly subscriptionService: subscriptionService,
  ) {}

  // In-person payment recorded by an admin (see specs.md §3.5). Still the
  // only way a payment gets written until Mercado Pago exists.
  async createManualPayment(dto: ManualPaymentDto, adminId: number) {
    const subscription = await this.subscriptionService.findSubscription(
      dto.subscriptionId,
    );
    if (!subscription || subscription.deleted) {
      throw new NotFoundException(
        `La suscripción con ID: ${dto.subscriptionId} no existe.`,
      );
    }

    // The other half of the self-service gate: a plan change opens the
    // subscription PENDING, and recording its payment is what makes it
    // active. Done before the payment row is written so a failure here
    // leaves no payment standing against a subscription that stayed pending.
    // `state` is a plain string column, so the enum member is widened to its
    // value before comparing.
    const pendingState: string = SubscriptionState.PENDING;
    if (subscription.state === pendingState) {
      await this.subscriptionService.activate(subscription.id);
    }

    const newPayment = this.paymentRepository.create({
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      payMethod: dto.payMethod,
      date: new Date(),
      state: PaymentState.COMPLETED,
      registeredById: adminId,
      deleted: false,
    });
    return this.paymentRepository.save(newPayment);
  }

  // Payment history of the authenticated user, through their own
  // subscriptions. userId comes from the JWT — never accept one as a
  // parameter here or anyone could read another person's payment history.
  async findMineForUser(userId: number) {
    return this.findByUser(userId);
  }

  // Payment history of one specific user (admin Users panel).
  async findByUser(userId: number) {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId })
      .andWhere('payment.deleted = false')
      .orderBy('payment.date', 'DESC')
      .getMany();
  }

  async createPayment(paymentDto: PaymentDto) {
    const newPayment = this.paymentRepository.create({
      ...paymentDto,
      date: new Date(paymentDto.date),
      state: paymentDto.state ?? PaymentState.COMPLETED,
      deleted: paymentDto.deleted ?? false,
    });
    return await this.paymentRepository.save(newPayment);
  }

  async findPayment(id: number) {
    return await this.paymentRepository.findOne({
      where: { id },
      relations: { subscription: true },
    });
  }

  async findAll() {
    return await this.paymentRepository.find({
      where: { deleted: false },
      // Explicit relations down to 'user'/'plan': eager:true on the
      // Subscription entity cannot be assumed to cascade here.
      relations: { subscription: { user: true, plan: true } },
    });
  }

  async findAllDeleted() {
    return await this.paymentRepository.find({
      where: { deleted: true },
      relations: { subscription: true },
    });
  }

  async updatePayment(paymentDto: PaymentDto) {
    if (!paymentDto.id) {
      throw new ConflictException(
        'El ID del pago es obligatorio para actualizar.',
      );
    }
    const exists = await this.findPayment(paymentDto.id);
    if (!exists) {
      throw new NotFoundException(
        `El pago con ID: ${paymentDto.id} no existe.`,
      );
    }
    const updatedPayment = {
      ...paymentDto,
      date: paymentDto.date ? new Date(paymentDto.date) : exists.date,
    };
    return await this.paymentRepository.save(updatedPayment);
  }

  async deletePayment(id: number) {
    const exists = await this.findPayment(id);
    if (!exists) {
      throw new NotFoundException(`El pago con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El pago ya está eliminado.`);
    }
    const rows: UpdateResult = await this.paymentRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el pago`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restorePayment(id: number) {
    const exists = await this.findPayment(id);
    if (!exists) {
      throw new NotFoundException(`El pago con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El pago no está borrado.`);
    }
    const rows: UpdateResult = await this.paymentRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se restaurar el pago`);
    }

    return { message: `Restaurado correctamente` };
  }
}
