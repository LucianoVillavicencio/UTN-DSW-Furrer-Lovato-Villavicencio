import { Module } from '@nestjs/common';
import { MercadoPagoModule } from './mercadopago.module';
import { PaymentModule } from '../payment/payment.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MailModule } from '../../common/mail/mail.module';
import { WebhookController } from './webhook.controller';
import { ORDER_RESOLVER, WebhookService } from './webhook.service';

/**
 * Hosts the webhook receiver as its own module, deliberately separate from
 * `MercadoPagoModule`. `MercadoPagoModule` is a pure leaf (config + client
 * only, `controllers: []`, never imports another feature module) precisely
 * so every feature that needs to talk to Mercado Pago can import it without
 * risk of a circular module graph. The webhook needs more than that leaf —
 * `PaymentService` to record a payment, `subscriptionService` to build the
 * receipt email, `MailService` to send it — and a later task (front-desk
 * card/QR charges) will need `ChargeOrderService` from a `ChargeOrderModule`
 * that ALSO imports `MercadoPagoModule` (to create orders on MP). Had the
 * webhook lived inside `MercadoPagoModule` itself, that would produce
 * `MercadoPagoModule` → `ChargeOrderModule` → `MercadoPagoModule`, a
 * circular import NestJS refuses to boot without `forwardRef` — a pattern
 * this codebase doesn't use anywhere and shouldn't need to introduce here.
 *
 * `ORDER_RESOLVER` is bound to a placeholder that always resolves `null`
 * ("nothing can be resolved yet") — safe, since `WebhookService` treats an
 * unresolvable notification as a no-op, never a crash or a write. Task 16
 * (front-desk charges) replaces this binding with one backed by a real
 * `ChargeOrderService`, once that module exists.
 */
@Module({
  imports: [MercadoPagoModule, PaymentModule, SubscriptionModule, MailModule],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    {
      provide: ORDER_RESOLVER,
      useValue: { resolve: () => Promise.resolve(null) },
    },
  ],
})
export class MercadoPagoWebhookModule {}
