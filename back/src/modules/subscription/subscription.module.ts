import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entity/subscription.entity';
import { subscriptionController } from './subscription.controller';
import { subscriptionService } from './subscription.service';
import { PlanModule } from '../plan/plan.module';
import { UserModule } from '../user/user.module';
import { PlanTermModule } from '../planTerm/planTerm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PlanModule,
    UserModule,
    PlanTermModule,
  ],
  controllers: [subscriptionController],
  providers: [subscriptionService],
  exports: [subscriptionService],
})
export class SubscriptionModule {}
