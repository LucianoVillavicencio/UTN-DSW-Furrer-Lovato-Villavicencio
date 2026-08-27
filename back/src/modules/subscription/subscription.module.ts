import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entity/subscription.entity';
import { subscriptionController } from './subscription.controller';
import { subscriptionService } from './subscription.service';
import { PlanModule } from '../plan/plan.module';
import { UserModule } from '../user/user.module';
import { PlanTermModule } from '../planTerm/planTerm.module';
// Needed only for the auto-renew toggle's card-existence check in
// subscription.controller.ts (SavedCardService.findActiveForUser). This is a
// one-way edge: SavedCardModule does not import SubscriptionModule back — see
// savedCard.module.ts's own comment for why.
import { SavedCardModule } from '../savedCard/savedCard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PlanModule,
    UserModule,
    PlanTermModule,
    SavedCardModule,
  ],
  controllers: [subscriptionController],
  providers: [subscriptionService],
  exports: [subscriptionService],
})
export class SubscriptionModule {}
