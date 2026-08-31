import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { Payment } from './entity/payment.entity';
import { PaymentDto } from './dto/payment-dto';
import { ManualPaymentDto } from './dto/manual-payment-dto';
import { PlanCheckoutDto } from './dto/plan-checkout-dto';
import { PaymentState } from './enum/payment-state.enum';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { UserService } from '../user/user.service';
import { PlanService } from '../plan/plan.service';
import { PlanDurationService } from '../plan/plan-duration.service';
import { resolveTerm } from '../plan/plan-duration.rules';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly subscriptionService: subscriptionService,
    private readonly planService: PlanService,
    private readonly planDurationService: PlanDurationService,
    private readonly userService: UserService,
  ) {}

  // One in-person sale, written atomically. The old path — assignPlanToMember,
  // then POST /Payment/manual — was two independent requests with no unit of
  // work between them: a failure after the first left the member with an
  // active plan and no payment on record.
  async registerPlanPayment(dto: PlanCheckoutDto, adminId: number) {
    // Validation happens outside the transaction: it takes no locks, and a
    // rejected sale should not have opened one.
    const member = await this.userService.findUser(dto.userId);
    if (!member || member.deleted) {
      throw new NotFoundException(`El socio con ID: ${dto.userId} no existe.`);
    }

    const plan = await this.planService.findPlan(dto.planId);
    if (!plan) {
      throw new NotFoundException(`El plan con ID: ${dto.planId} no existe.`);
    }

    const durations = await this.planDurationService.findByPlan(dto.planId);
    const term = resolveTerm(plan, dto.months, durations);

    return this.dataSource.transaction(async (manager) => {
      const subscription =
        await this.subscriptionService.replaceActiveSubscription(manager, {
          userId: dto.userId,
          planId: dto.planId,
          term,
        });

      const payment = manager.create(Payment, {
        subscriptionId: subscription.id,
        amount: dto.amount,
        payMethod: dto.payMethod,
        date: new Date(),
        state: PaymentState.COMPLETED,
        registeredById: adminId,
        deleted: false,
      });

      return manager.save(payment);
    });
  }

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

  // A raw registeredById means nothing to the admin looking at the "Pagos
  // recientes" table, so each row is annotated with the recording admin's
  // name. registeredById has no relation on the entity — it is a bare
  // nullable column, not a foreign key TypeORM can join — so the lookup is
  // done by hand rather than through `relations`. One findUser() call per
  // distinct admin, not per payment: a front desk records many payments a
  // day under a handful of admins.
  async findAll() {
    const payments = await this.paymentRepository.find({
      where: { deleted: false },
      // Explicit relations down to 'user'/'plan': eager:true on the
      // Subscription entity cannot be assumed to cascade here.
      relations: { subscription: { user: true, plan: true } },
    });

    const adminIds = [
      ...new Set(
        payments
          .map((p) => p.registeredById)
          .filter((id): id is number => id != null),
      ),
    ];

    const adminNames = new Map<number, string>();
    for (const id of adminIds) {
      const admin = await this.userService.findUser(id);
      if (admin) {
        adminNames.set(id, `${admin.name} ${admin.surname ?? ''}`.trim());
      }
    }

    return payments.map((p) => ({
      ...p,
      registeredByName:
        p.registeredById != null
          ? (adminNames.get(p.registeredById) ?? null)
          : null,
    }));
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
