import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRegistration } from './entity/classRegistration.entity';
import { ClassRegistrationController } from './classRegistration.controller';
import { ClassRegistrationService } from './classRegistration.service';
import { ClassSessionModule } from '../classSession/classSession.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassRegistration]),
    ClassSessionModule,
    SubscriptionModule,
  ],
  controllers: [ClassRegistrationController],
  providers: [ClassRegistrationService],
  exports: [ClassRegistrationService],
})
export class classRegistrationModule {}
