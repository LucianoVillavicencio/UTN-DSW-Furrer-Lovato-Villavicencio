import { Module } from '@nestjs/common';
import { MercadoPagoModule } from './mercadopago.module';
import { PaymentModule } from '../payment/payment.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MailModule } from '../../common/mail/mail.module';
import { ChargeOrderModule } from '../chargeOrder/chargeOrder.module';
import { ChargeOrderResolverAdapter } from '../chargeOrder/chargeOrder-resolver.adapter';
import { WebhookController } from './webhook.controller';
import { WebhookRootController } from './webhook-root.controller';
import { ORDER_RESOLVER, WebhookService } from './webhook.service';

/**
 * Hosts the webhook receiver as its own module, deliberately separate from
 * `MercadoPagoModule`. `MercadoPagoModule` is a pure leaf (config + client
 * only, `controllers: []`, never imports another feature module) precisely
 * so every feature that needs to talk to Mercado Pago can import it without
 * risk of a circular module graph. The webhook needs more than that leaf —
 * `PaymentService` to record a payment, `subscriptionService` to build the
 * receipt email, `MailService` to send it, and (since Task 16) `ChargeOrderModule`
 * to resolve/close front-desk card and QR orders. `ChargeOrderModule` itself
 * imports `MercadoPagoModule` (to create orders on MP from its own
 * controller), never this module — so the graph stays
 * `MercadoPagoWebhookModule` -> `ChargeOrderModule` -> `MercadoPagoModule`,
 * one direction, no `forwardRef` needed.
 *
 * `ORDER_RESOLVER` is bound to `ChargeOrderResolverAdapter`, a thin
 * `ChargeOrderService`-backed implementation of `OrderResolver` (see
 * webhook.service.ts). Before Task 16 this was a placeholder that always
 * resolved `null` — safe, since `WebhookService` treats an unresolvable
 * notification as a no-op, never a crash or a write.
 */
@Module({
  imports: [
    MercadoPagoModule,
    PaymentModule,
    SubscriptionModule,
    MailModule,
    ChargeOrderModule,
  ],
  controllers: [WebhookController, WebhookRootController],
  providers: [
    WebhookService,
    ChargeOrderResolverAdapter,
    { provide: ORDER_RESOLVER, useExisting: ChargeOrderResolverAdapter },
  ],
})
export class MercadoPagoWebhookModule {}
