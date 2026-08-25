import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from './entity/trainer.entity';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer]), ClassModule],
  controllers: [TrainerController],
  providers: [TrainerService],
  exports: [TrainerService],
})
export class TrainerModule {}
