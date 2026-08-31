import { Inject, Injectable, Logger } from '@nestjs/common';
import { MercadoPagoClient, MpPaymentResult } from './mercadopago.client';
import { PaymentService } from '../payment/payment.service';
import { subscriptionService } from '../subscription/subscription.service';
import { MailService } from '../../common/mail/mail.service';

/** DI token for the injected {@link OrderResolver} — see the interface below. */
export const ORDER_RESOLVER = Symbol('ORDER_RESOLVER');

/**
 * The order snapshot a webhook notification is checked against: what the
 * caller who created the order originally intended to charge. `amount` is
 * compared against the re-fetched, authoritative payment amount before
 * anything is written — never the webhook body's own amount.
 */
export interface ResolvedOrder {
  subscriptionId: number;
  amount: number;
  termMonths: number;
  payMethod: string;
  // The admin who started the charge at the counter (ChargeOrder.createdById),
  // so the resulting Payment.registeredById reflects that someone DID record
  // this one — unlike an online renewal, which has nobody to attribute it to.
  // Optional/nullable so a future resolver with no notion of "who" (there
  // isn't one today) doesn't have to fabricate a value.
  registeredById?: number | null;
}

/**
 * Maps a Mercado Pago payment's `external_reference` back to whatever placed
 * the order. Front-desk card/QR charges (Task 16) resolve through
 * `charge_orders`, via `ChargeOrderService`. A saved-card renewal never goes
 * through this at all — that flow is synchronous (the cron calls
 * `chargeSavedCard` and gets an immediate result, then calls
 * `PaymentService.createFromMercadoPago` itself), so it never waits on a
 * webhook.
 *
 * Task 16 binds a real `ChargeOrderService`-backed implementation
 * (`ChargeOrderResolverAdapter`) in `MercadoPagoWebhookModule`. Before that,
 * a placeholder whose `resolve` always returned `null` was used — safe,
 * since `WebhookService.handleNotification` treats an unresolvable
 * notification as a no-op, never a crash or a write.
 */
export interface OrderResolver {
  resolve(externalReference: string): Promise<ResolvedOrder | null>;
  // Called once the webhook has durably recorded the payment for this order,
  // so the resolver can close its own bookkeeping (e.g. ChargeOrder ->
  // 'pagada'). Must not be called before the Payment write succeeds.
  close(externalReference: string, paymentId: number): Promise<void>;
}

/**
 * The business logic behind the Mercado Pago webhook: given a notification's
 * `data.id` (already signature-verified by `WebhookController` before this is
 * ever called), decide whether it represents money the app should record.
 *
 * Every step here treats Mercado Pago's `getPayment` response — never the
 * webhook body — as the only source of truth for status and amount. The
 * webhook body cannot be trusted: anyone who can reach this URL can post
 * whatever JSON they like to it (that's exactly why the signature check
 * exists at the edge, but even a genuine, correctly-signed notification is
 * documented by Mercado Pago as a "something changed, go look it up" ping,
 * not a payload to act on directly).
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly client: MercadoPagoClient,
    @Inject(ORDER_RESOLVER) private readonly orderResolver: OrderResolver,
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: subscriptionService,
    private readonly mailService: MailService,
  ) {}

  /**
   * A `payment`-topic notification's `data.id` is a legacy Payments API id
   * (`GET /v1/payments/{id}`, via `getPayment`). An `order`-topic
   * notification's `data.id` is instead an Orders API order id — the id
   * Point/QR front-desk charges actually create (`MercadoPagoClient.createOrder`)
   * — which must be re-fetched via `getOrder` and mapped onto the same
   * payment-shaped result the rest of this service already knows how to
   * process. Passing an order id to `getPayment` (or vice versa) 404s: the
   * two are different resource namespaces, not two names for the same id.
   * Any other topic (e.g. `merchant_order`, `chargebacks`) is a no-op —
   * nothing this service knows how to record.
   */
  private async fetchPaymentLike(
    dataId: string,
    type: string,
  ): Promise<MpPaymentResult | null> {
    if (type === 'order') {
      const order = await this.client.getOrder(dataId);
      if (!order.paymentId) {
        return null;
      }
      return {
        id: order.paymentId,
        status: order.status === 'processed' ? 'approved' : order.status,
        statusDetail: order.statusDetail,
        transactionAmount: order.totalPaidAmount,
        externalReference: order.externalReference,
      };
    }
    if (type === 'payment') {
      return this.client.getPayment(dataId);
    }
    this.logger.warn(
      `Ignoring webhook notification of unhandled type "${type}".`,
    );
    return null;
  }

  async handleNotification(
    dataId: string,
    type: string = 'payment',
  ): Promise<void> {
    const payment = await this.fetchPaymentLike(dataId, type);
    if (!payment) {
      return;
    }

    // Only an approved payment is ever money the app should record. A
    // decline, a still-pending in_process, a cancellation — none of those
    // are acted on here; MP still gets a 200 either way, since there is
    // nothing more useful this endpoint can do with them.
    if (payment.status !== 'approved') {
      return;
    }

    // Idempotency: MP retries a notification up to eight times over four
    // days. A second delivery of a payment already recorded must be a
    // silent no-op, not a duplicate write — PaymentService.createFromMercadoPago
    // is itself idempotent on mpPaymentId, but checking here too means a
    // retry short-circuits without even attempting the write.
    const existing = await this.paymentService.findByMpPaymentId(payment.id);
    if (existing) {
      // A prior delivery could have written the Payment and then failed inside
      // orderResolver.close() — every later retry would otherwise short-circuit
      // right here forever, leaving the ChargeOrder stuck 'pendiente' (and its
      // collection point blocked) until expireStale times it out. resolve()
      // returns non-null only while the order genuinely still needs closing
      // (see its own status check), so this recovers that case without risking
      // a double-close: once close() has actually succeeded, resolve() returns
      // null and this becomes a no-op.
      if (payment.externalReference) {
        const stillPending = await this.orderResolver.resolve(
          payment.externalReference,
        );
        if (stillPending) {
          try {
            await this.orderResolver.close(
              payment.externalReference,
              existing.id,
            );
          } catch (err) {
            // Swallowed on purpose: the Payment is already durably recorded,
            // so throwing here would only earn another MP retry that lands
            // back on this same branch. The next retry gets another chance.
            this.logger.warn(
              `Retry could not close the order for already-recorded payment ${payment.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }
      return;
    }

    if (!payment.externalReference) {
      this.logger.warn(
        `Payment ${payment.id} has no external_reference — nothing to resolve it against.`,
      );
      return;
    }

    const resolved = await this.orderResolver.resolve(
      payment.externalReference,
    );
    if (!resolved) {
      this.logger.warn(
        `No order resolves external reference ${payment.externalReference} (payment ${payment.id}).`,
      );
      return;
    }

    // The order snapshot's amount, not the webhook body's — refuses a
    // payment that was somehow approved for a different amount than what the
    // order was created for, instead of crediting whatever MP says was paid.
    //
    // Both sides are coerced with Number() rather than compared directly:
    // resolved.amount traces back to a MySQL DECIMAL column, which the mysql2
    // driver hands back as a STRING unless the column opts into
    // decimalTransformer (ChargeOrder.amount does). This costs nothing while
    // that transformer is in place, and stops a future decimal column that
    // forgets it from silently turning every approved payment into a
    // "mismatch" that is logged and thrown away.
    if (Number(payment.transactionAmount) !== Number(resolved.amount)) {
      this.logger.warn(
        `Payment ${payment.id} amount ${String(payment.transactionAmount)} does not match order snapshot ${resolved.amount} for external reference ${payment.externalReference}.`,
      );
      return;
    }

    const createdPayment = await this.paymentService.createFromMercadoPago({
      mpPaymentId: payment.id,
      subscriptionId: resolved.subscriptionId,
      amount: resolved.amount,
      termMonths: resolved.termMonths,
      payMethod: resolved.payMethod,
      registeredById: resolved.registeredById ?? null,
    });

    // Only after the Payment write has actually succeeded — closing the
    // resolver's own bookkeeping (e.g. ChargeOrder -> 'pagada') before that
    // would risk marking an order paid with no Payment row behind it.
    await this.orderResolver.close(
      payment.externalReference,
      createdPayment.id,
    );

    // Re-fetched after the write (rather than resolved beforehand) so the
    // receipt's endDate reflects the activation/renewal that
    // createFromMercadoPago just performed, not the subscription's state
    // before this payment.
    const subscription = await this.subscriptionService.findSubscription(
      resolved.subscriptionId,
    );
    if (!subscription) {
      // Should be unreachable — createFromMercadoPago itself would have
      // thrown NotFoundException for a subscription that doesn't exist — but
      // a missing receipt is not worth crashing a webhook delivery over.
      return;
    }

    await this.mailService.sendPaymentReceipt({
      to: subscription.user.email,
      name: subscription.user.name,
      planName: subscription.plan.name,
      amount: resolved.amount,
      termMonths: resolved.termMonths,
      method: resolved.payMethod,
      newEndDate: subscription.endDate,
    });
  }
}
