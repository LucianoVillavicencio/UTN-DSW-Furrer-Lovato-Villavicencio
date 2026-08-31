import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeOrder } from './entity/chargeOrder.entity';
import { ChargeOrderService } from './chargeOrder.service';
import { ChargeOrderController } from './chargeOrder.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PlanModule } from '../plan/plan.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { PaymentModule } from '../payment/payment.module';

// MercadoPagoModule and PaymentModule are needed from here on (Task 16): the
// controller dispatches orders through MercadoPagoClient and looks up the
// resulting Payment/subscription endDate for the polling GET. Both are safe
// to import — MercadoPagoModule is a pure leaf, and PaymentModule imports
// neither this module nor MercadoPagoWebhookModule (see that module's own
// comment on why the graph stays one-directional).
@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeOrder]),
    SubscriptionModule,
    PlanModule,
    MercadoPagoModule,
    PaymentModule,
  ],
  controllers: [ChargeOrderController],
  providers: [ChargeOrderService],
  exports: [ChargeOrderService],
})
export class ChargeOrderModule {}
