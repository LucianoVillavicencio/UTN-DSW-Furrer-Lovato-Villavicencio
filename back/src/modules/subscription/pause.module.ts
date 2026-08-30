import { Module } from '@nestjs/common';
import { PauseController } from './pause.controller';
import { PauseService } from './pause.service';
import { SubscriptionModule } from './subscription.module';
import { classRegistrationModule } from '../classRegistration/classRegistration.module';

// Exists so pausing a membership can reach BOTH subscriptionService (to flip
// state/pausedAt/pausedById) AND ClassRegistrationService (to drop the
// member's future reservations) without a circular import.
//
// classRegistrationModule already imports SubscriptionModule (it needs
// subscriptionService.findActiveForUser for its own enrollment logic). If
// this pause/unpause logic lived inside SubscriptionModule instead, that
// module would in turn need to import classRegistrationModule to reach
// ClassRegistrationService — SubscriptionModule -> classRegistrationModule ->
// SubscriptionModule, which NestJS cannot boot without forwardRef, a pattern
// this codebase does not use anywhere. Living one level up, in its own
// module that imports both, avoids the cycle entirely.
@Module({
  imports: [SubscriptionModule, classRegistrationModule],
  controllers: [PauseController],
  providers: [PauseService],
  exports: [PauseService],
})
export class PauseModule {}
