import { Injectable } from '@nestjs/common';
import { ChargeOrderService } from './chargeOrder.service';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';
import type {
  OrderResolver,
  ResolvedOrder,
} from '../mercadopago/webhook.service';

/**
 * Real `OrderResolver` for front-desk card/QR charges, backed by
 * `ChargeOrderService`. Bound to `ORDER_RESOLVER` in
 * `MercadoPagoWebhookModule`, replacing the always-null placeholder that
 * shipped before this order type existed.
 *
 * A separate class rather than an inline factory closure — easier to
 * unit-test in isolation, same reasoning as every other adapter in this
 * codebase.
 */
@Injectable()
export class ChargeOrderResolverAdapter implements OrderResolver {
  constructor(private readonly chargeOrderService: ChargeOrderService) {}

  async resolve(externalReference: string): Promise<ResolvedOrder | null> {
    const chargeOrder =
      await this.chargeOrderService.findByExternalReference(externalReference);

    // A resolved-but-already-closed (paid) or cancelled/expired/errored order
    // must NOT resolve again — only a still-live 'pendiente' order is a valid
    // target. WebhookService's own idempotency check on mpPaymentId already
    // covers a retried delivery of a notification already recorded; this
    // check instead guards against acting on an order this side closed for
    // some other reason (cancelled at the counter, expired) while a stale MP
    // notification for it is still in flight.
    const pendingStatus: string = ChargeOrderStatus.PENDING;
    if (!chargeOrder || chargeOrder.status !== pendingStatus) {
      return null;
    }

    return {
      subscriptionId: chargeOrder.subscriptionId,
      amount: chargeOrder.amount,
      termMonths: chargeOrder.planTerm.months,
      payMethod: chargeOrder.method,
      registeredById: chargeOrder.createdById,
    };
  }

  async close(externalReference: string, paymentId: number): Promise<void> {
    await this.chargeOrderService.closeAsPaid(externalReference, paymentId);
  }
}
