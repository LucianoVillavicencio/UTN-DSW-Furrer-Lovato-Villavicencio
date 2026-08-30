import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ChargeOrder } from './entity/chargeOrder.entity';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { PlanTermService } from '../planTerm/planTerm.service';
import {
  buildExternalReference,
  ORDER_EXPIRATION_MS,
} from './chargeOrder.rules';

export interface CreateChargeParams {
  subscriptionId: number;
  planTermId: number;
  method: 'point' | 'qr';
  collectionPointId: string;
  adminId: number;
}

// Front-desk bookkeeping for card-terminal ("point") and QR charges. This is
// entity + local service only — no Mercado Pago calls happen here yet (that
// arrives with the controller in Task 16). See chargeOrder.rules.ts for the
// external_reference format and expiration shared with the MP order this
// row will eventually back.
@Injectable()
export class ChargeOrderService {
  private readonly logger = new Logger(ChargeOrderService.name);

  constructor(
    @InjectRepository(ChargeOrder)
    private chargeOrderRepository: Repository<ChargeOrder>,
    private readonly subscriptionService: subscriptionService,
    private readonly planTermService: PlanTermService,
  ) {}

  // Arms a new charge order at the counter. The busy-collection-point check
  // (step 5) is the rule that makes a shared printed QR safe: whatever order
  // is armed on that caja is what the next person to scan will pay, so two
  // open orders on the same point would let two different members cross
  // amounts. It is deliberately keyed on collectionPointId, not
  // subscriptionId.
  async createCharge(params: CreateChargeParams) {
    const { subscriptionId, planTermId, method, collectionPointId, adminId } =
      params;

    const subscription =
      await this.subscriptionService.findSubscription(subscriptionId);
    if (!subscription || subscription.deleted) {
      throw new NotFoundException(
        `La suscripción con ID: ${subscriptionId} no existe.`,
      );
    }

    // `state` is a plain string column, so the enum member is widened to its
    // value before comparing — same pattern as PaymentService.
    const pausedState: string = SubscriptionState.PAUSED;
    if (subscription.state === pausedState) {
      throw new ConflictException('No se puede cobrar una membresía pausada.');
    }

    const term = await this.planTermService.findTerm(planTermId);
    // A term from another plan must not silently apply here — same
    // cross-check as subscriptionService.resolvePlanTerm.
    if (!term || term.deleted || term.planId !== subscription.planId) {
      throw new NotFoundException(
        `El plazo con ID: ${planTermId} no existe para este plan.`,
      );
    }

    // Expire stale orders before checking whether the point is busy, so an
    // abandoned charge from a few minutes ago never blocks the counter. Bulk
    // cleanup, not part of the atomicity concern below, so it runs on its
    // own outside the transaction.
    await this.expireStale();

    const now = new Date();
    const externalReference = buildExternalReference(
      subscriptionId,
      randomUUID().slice(0, 8),
    );

    // The busy check and the insert MUST run as one atomic unit: two
    // near-simultaneous createCharge calls for the same collectionPointId (a
    // double-tap at the counter, two admin sessions) could otherwise both
    // pass the check before either saves, arming two live orders on one
    // physical point — exactly the failure this table exists to prevent.
    // setLock('pessimistic_write') takes a row lock on any matching order,
    // so a concurrent second transaction blocks on this SELECT until the
    // first one commits or rolls back, rather than racing past the check.
    // Same manager.transaction(...) pattern as
    // SavedCardService.saveForUser's deactivate-then-insert pair.
    return this.chargeOrderRepository.manager.transaction(async (manager) => {
      const pendingState: string = ChargeOrderStatus.PENDING;
      const busyOrder = await manager
        .createQueryBuilder(ChargeOrder, 'chargeOrder')
        .setLock('pessimistic_write')
        .where('chargeOrder.collectionPointId = :collectionPointId', {
          collectionPointId,
        })
        .andWhere('chargeOrder.status = :status', { status: pendingState })
        .getOne();
      if (busyOrder) {
        throw new ConflictException(
          'Ya hay un cobro en curso en este punto de cobro.',
        );
      }

      const newOrder = manager.create(ChargeOrder, {
        subscriptionId,
        planTermId,
        method,
        externalReference,
        mpOrderId: null,
        collectionPointId,
        // Snapshot the term's price, not the plan's — see the entity
        // comment on `amount`.
        amount: term.price,
        status: ChargeOrderStatus.PENDING,
        expiresAt: new Date(now.getTime() + ORDER_EXPIRATION_MS),
        paymentId: null,
        createdById: adminId,
        createdAt: now,
        updatedAt: now,
      });

      return manager.save(newOrder);
    });
  }

  async findByExternalReference(externalReference: string) {
    return this.chargeOrderRepository.findOne({
      where: { externalReference },
    });
  }

  // Closes an order once the webhook (Task 16+) confirms Mercado Pago
  // approved the payment.
  async closeAsPaid(externalReference: string, paymentId: number) {
    const order = await this.findByExternalReference(externalReference);
    if (!order) {
      throw new NotFoundException(
        `No existe una orden de cobro con referencia: ${externalReference}.`,
      );
    }
    order.status = ChargeOrderStatus.PAID;
    order.paymentId = paymentId;
    order.updatedAt = new Date();
    return this.chargeOrderRepository.save(order);
  }

  // Closes an order Mercado Pago reported as failed. `reason` is logged for
  // diagnostics only in this task — there is no column for it yet; a later
  // task may add one if that turns out to be needed.
  async closeAsError(externalReference: string, reason: string) {
    const order = await this.findByExternalReference(externalReference);
    if (!order) {
      throw new NotFoundException(
        `No existe una orden de cobro con referencia: ${externalReference}.`,
      );
    }
    this.logger.warn(
      `Charge order ${externalReference} closed as error: ${reason}`,
    );
    order.status = ChargeOrderStatus.ERROR;
    order.updatedAt = new Date();
    return this.chargeOrderRepository.save(order);
  }

  // An admin backing out of a charge before it settled. `adminId` is accepted
  // for the caller's own audit-log purposes — there is no dedicated column
  // for it on this entity, so it is not persisted here.
  async cancel(id: number, adminId: number) {
    const order = await this.chargeOrderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`La orden de cobro con ID: ${id} no existe.`);
    }
    this.logger.log(`Charge order ${id} cancelled by admin ${adminId}`);
    order.status = ChargeOrderStatus.CANCELLED;
    order.updatedAt = new Date();
    return this.chargeOrderRepository.save(order);
  }

  // Bulk-flips every PENDING order past its expiresAt to EXPIRED. Called at
  // the start of createCharge rather than on its own cron, so an abandoned
  // charge never blocks the counter — see the note there. Mirrors
  // subscriptionService.expireLapsedSubscriptions's bulk update() shape.
  async expireStale() {
    return this.chargeOrderRepository.update(
      {
        status: ChargeOrderStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      { status: ChargeOrderStatus.EXPIRED, updatedAt: new Date() },
    );
  }
}
