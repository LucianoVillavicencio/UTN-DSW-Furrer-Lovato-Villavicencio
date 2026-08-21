import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { PlanModule } from './modules/plan/plan.module';
import { TrainerModule } from './modules/trainer/trainer.module';
import { ClassModule } from './modules/class/class.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TypeClassModule } from './modules/typeClass/typeClass.module';
import { classRegistrationModule } from './modules/classRegistration/classRegistration.module';
import { ClassSessionModule } from './modules/classSession/classSession.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { ContactModule } from './modules/contact/contact.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UserModule,
    TypeClassModule,
    PlanModule,
    TrainerModule,
    ClassModule,
    ClassSessionModule,
    SubscriptionModule,
    PaymentModule,
    classRegistrationModule,
    ContactModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
