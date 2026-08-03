import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entity/subscription.entity';
import { subscriptionController } from './subscription.controller';
import { subscriptionService } from './subscription.service';


@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [subscriptionController],
  providers: [subscriptionService],
  exports: [subscriptionService],
})
export class SubscriptionModule {}
