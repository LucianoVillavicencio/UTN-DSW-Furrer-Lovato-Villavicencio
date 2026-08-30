import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeOrder } from './entity/chargeOrder.entity';
import { ChargeOrderService } from './chargeOrder.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PlanTermModule } from '../planTerm/planTerm.module';

// No MercadoPagoModule import here — this task is entity + local bookkeeping
// only. The controller that actually calls the MP client (Task 16) is what
// pulls that dependency in.
@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeOrder]),
    SubscriptionModule,
    PlanTermModule,
  ],
  providers: [ChargeOrderService],
  exports: [ChargeOrderService],
})
export class ChargeOrderModule {}
