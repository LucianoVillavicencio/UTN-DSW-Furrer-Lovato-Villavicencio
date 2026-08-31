import { Module } from '@nestjs/common';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { PaymentModule } from '../payment/payment.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [MercadoPagoModule, PaymentModule, SubscriptionModule, MailModule],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
