import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payment/entity/payment.entity';
import { Subscription } from '../subscription/entity/subscription.entity';
import { Plan } from '../plan/entity/plan.entity';
import { PlanDuration } from '../plan/entity/plan-duration.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OwnerPasswordGuard } from './analytics.guard';

@Module({
  // Registers the entities it aggregates rather than importing PaymentModule
  // and SubscriptionModule: this feature owns read-only query builders, and
  // importing their services would hand it writes it must never perform.
  imports: [
    TypeOrmModule.forFeature([Payment, Subscription, Plan, PlanDuration]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, OwnerPasswordGuard],
})
export class AnalyticsModule {}
