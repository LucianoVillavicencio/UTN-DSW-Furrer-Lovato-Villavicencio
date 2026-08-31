import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedCard } from './entity/savedCard.entity';
import { Subscription } from '../subscription/entity/subscription.entity';
import { SavedCardService } from './savedCard.service';
import { SavedCardController } from './savedCard.controller';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

// Registers the Subscription entity directly, NOT SubscriptionModule: this
// module never imports SubscriptionModule, because SubscriptionModule
// imports THIS module (for the auto-renew toggle's card-existence check in
// subscription.controller.ts) — the reverse edge would be a circular module
// dependency. SavedCardService only ever needs a plain field write on
// Subscription (turning autoRenew off), not subscriptionService's business
// logic, so a bare repository is enough.
@Module({
  imports: [
    TypeOrmModule.forFeature([SavedCard, Subscription]),
    MercadoPagoModule,
  ],
  controllers: [SavedCardController],
  providers: [SavedCardService],
  exports: [SavedCardService],
})
export class SavedCardModule {}
