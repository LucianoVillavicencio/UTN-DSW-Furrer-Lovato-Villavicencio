import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRegistration } from './entity/classRegistration.entity';
import { ClassRegistrationController } from './classRegistration.controller';
import { ClassRegistrationService } from './classRegistration.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClassRegistration])],
  controllers: [ClassRegistrationController],
  providers: [ClassRegistrationService],
  exports: [ClassRegistrationService],
})
export class classRegistrationModule {}
