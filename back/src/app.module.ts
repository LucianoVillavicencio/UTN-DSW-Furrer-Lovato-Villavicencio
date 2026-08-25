import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './config/typeorm.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AUTH_THROTTLE, CONTACT_THROTTLE } from './auth/auth.throttle';
import { SecurityLogInterceptor } from './common/interceptors/security-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([AUTH_THROTTLE, CONTACT_THROTTLE]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmConfig,
    }),
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
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: SecurityLogInterceptor },
  ],
})
export class AppModule {}
