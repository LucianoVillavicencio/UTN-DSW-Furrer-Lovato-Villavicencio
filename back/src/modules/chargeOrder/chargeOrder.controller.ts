import {
  BadGatewayException,
  Body,
  ConflictException,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';
import { ChargeOrderService } from './chargeOrder.service';
import { CreateChargeOrderDto } from './dto/create-charge-order-dto';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';
import { ChargeOrderMethod } from './enum/chargeOrder-method.enum';
import { ORDER_EXPIRATION } from './chargeOrder.rules';
import {
  MercadoPagoClient,
  QR_MODE_HYBRID,
  type MpOrderResult,
} from '../mercadopago/mercadopago.client';
import { MercadoPagoConfig } from '../mercadopago/mercadopago.config';
import { PaymentService } from '../payment/payment.service';

// Front-desk card-terminal ("point") and QR charges — admin-only, same
// gating pattern as PaymentController. No public route depends on this.
@Controller('api/v1/charge-order')
@ApiTags('ChargeOrder')
@Auth(Role.ADMIN)
// Not rate limited — same reasoning as PaymentController; see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class ChargeOrderController {
  private readonly logger = new Logger(ChargeOrderController.name);

  constructor(
    private readonly chargeOrderService: ChargeOrderService,
    private readonly mercadoPagoClient: MercadoPagoClient,
    private readonly mercadoPagoConfig: MercadoPagoConfig,
    private readonly paymentService: PaymentService,
  ) {}

  // Arms a charge order locally, then dispatches it to Mercado Pago. If MP
  // rejects the order, the local row is closed as 'error' before responding
  // — a 'pendiente' row that no terminal/QR will ever actually be armed for
  // would otherwise sit there confusing the front desk and blocking the
  // collection point until it expires on its own.
  @Post()
  async createCharge(
    @ActiveUser() admin: UserActiveInterface,
    @Body() dto: CreateChargeOrderDto,
  ) {
    // Which physical terminal / QR caja this charge is armed against comes
    // from the SERVER's own config, never from the request body. It is what
    // ChargeOrderService.createCharge's busy-collection-point check is keyed
    // on — the one safety property the shared-printed-QR design rests on
    // (two admins must never arm two live orders on the same physical point),
    // so two browsers configured slightly differently must not be able to
    // disagree about what that check even means.
    //
    // dto.collectionPointId is deliberately left on the DTO and simply
    // ignored: main.ts's ValidationPipe runs with forbidNonWhitelisted, so
    // dropping the field would 400 every request the front desk sends today.
    const collectionPointId =
      dto.method === ChargeOrderMethod.POINT
        ? this.mercadoPagoConfig.pointTerminalId
        : this.mercadoPagoConfig.qrExternalPosId;
    if (!collectionPointId) {
      throw new ConflictException(
        dto.method === ChargeOrderMethod.POINT
          ? 'La terminal Point no está configurada en el servidor.'
          : 'La caja QR no está configurada en el servidor.',
      );
    }

    const chargeOrder = await this.chargeOrderService.createCharge({
      subscriptionId: dto.subscriptionId,
      planTermId: dto.planTermId,
      method: dto.method,
      collectionPointId,
      adminId: admin.sub,
    });

    // Deterministic and unique per order (external_reference already is),
    // so a retried request against the same order never double-arms it on
    // MP's side.
    const idempotencyKey = chargeOrder.externalReference;
    const description = `Cobro de membresía — suscripción #${chargeOrder.subscriptionId}`;

    let mpOrder: MpOrderResult;
    try {
      mpOrder =
        dto.method === ChargeOrderMethod.POINT
          ? await this.mercadoPagoClient.createOrder({
              type: 'point',
              externalReference: chargeOrder.externalReference,
              totalAmount: chargeOrder.amount,
              expirationTime: ORDER_EXPIRATION,
              description,
              idempotencyKey,
              // terminal_id — see the entity's comment on collectionPointId.
              // This shape is an educated guess by symmetry with the
              // verified `qr` body below, not confirmed against live docs —
              // see MercadoPagoClient.createOrder's own comment.
              point: { terminal_id: collectionPointId },
            })
          : await this.mercadoPagoClient.createOrder({
              type: 'qr',
              externalReference: chargeOrder.externalReference,
              totalAmount: chargeOrder.amount,
              expirationTime: ORDER_EXPIRATION,
              description,
              idempotencyKey,
              // external_pos_id — see the entity's comment on
              // collectionPointId. This shape IS verified against live docs.
              qr: {
                external_pos_id: collectionPointId,
                mode: QR_MODE_HYBRID,
              },
            });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.chargeOrderService.closeAsError(
        chargeOrder.externalReference,
        reason,
      );
      throw new BadGatewayException(
        'No se pudo iniciar el cobro en Mercado Pago. Intente nuevamente.',
      );
    }

    await this.chargeOrderService.setMpOrderId(
      chargeOrder.id,
      mpOrder.id,
      mpOrder.qrData ?? null,
    );

    return {
      id: chargeOrder.id,
      status: chargeOrder.status,
      method: chargeOrder.method,
      amount: chargeOrder.amount,
      // Only meaningful for 'qr' — the panel renders this as the code to
      // scan. Absent (null) for 'point', where the terminal itself prompts.
      // Same field name as GET /:id's qrPayload — this is the same
      // persisted value, not a separately-derived one.
      qrPayload: mpOrder.qrData ?? null,
      expiresAt: chargeOrder.expiresAt,
    };
  }

  // The polling endpoint the front-desk panel hits while a charge is armed.
  @Get(':id')
  async getCharge(@Param('id', ParseIntPipe) id: number) {
    const chargeOrder = await this.chargeOrderService.findById(id);

    let newEndDate: Date | string | null = null;
    const paidStatus: string = ChargeOrderStatus.PAID;
    if (chargeOrder.status === paidStatus && chargeOrder.paymentId) {
      const payment = await this.paymentService.findPayment(
        chargeOrder.paymentId,
      );
      newEndDate = payment?.subscription?.endDate ?? null;
    }

    return {
      status: chargeOrder.status,
      method: chargeOrder.method,
      amount: chargeOrder.amount,
      // Persisted by setMpOrderId at order-creation time (see
      // ChargeOrderService), not derived here — lets a panel reload or
      // re-poll recover the code for the rest of the order's 5-minute
      // window, not just see it once in the original POST response. Always
      // null for a 'point' order.
      qrPayload: chargeOrder.qrPayload,
      newEndDate,
      expiresAt: chargeOrder.expiresAt,
      updatedAt: chargeOrder.updatedAt,
    };
  }

  // Frees a stuck charge — the only way to free a shared QR before it
  // expires on its own. Must free the local row even when the MP call
  // fails: logging the failure and cancelling locally regardless is the
  // whole point of this endpoint existing.
  @Patch(':id/cancel')
  async cancelCharge(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() admin: UserActiveInterface,
  ) {
    const chargeOrder = await this.chargeOrderService.findById(id);

    if (chargeOrder.mpOrderId) {
      try {
        await this.mercadoPagoClient.cancelOrder(chargeOrder.mpOrderId);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to cancel Mercado Pago order for charge order ${id}: ${reason}`,
        );
      }
    }

    return this.chargeOrderService.cancel(id, admin.sub);
  }
}
