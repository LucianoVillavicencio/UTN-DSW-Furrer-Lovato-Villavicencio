import { Inject, Injectable, Logger } from '@nestjs/common';
import { MercadoPagoClient } from './mercadopago.client';
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
 * `MercadoPagoWebhookModule` binds a placeholder implementation for this
 * task — `resolve` always returns `null`, meaning nothing can be resolved
 * yet. That is safe: an unresolvable notification is a no-op (see
 * `WebhookService.handleNotification`), never a crash and never a write.
 * Task 16 swaps the placeholder for a real `ChargeOrderService`-backed one.
 */
export interface OrderResolver {
  resolve(externalReference: string): Promise<ResolvedOrder | null>;
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

  async handleNotification(dataId: string): Promise<void> {
    const payment = await this.client.getPayment(dataId);

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
    if (payment.transactionAmount !== resolved.amount) {
      this.logger.warn(
        `Payment ${payment.id} amount ${String(payment.transactionAmount)} does not match order snapshot ${resolved.amount} for external reference ${payment.externalReference}.`,
      );
      return;
    }

    await this.paymentService.createFromMercadoPago({
      mpPaymentId: payment.id,
      subscriptionId: resolved.subscriptionId,
      amount: resolved.amount,
      termMonths: resolved.termMonths,
      payMethod: resolved.payMethod,
      registeredById: null,
    });

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
