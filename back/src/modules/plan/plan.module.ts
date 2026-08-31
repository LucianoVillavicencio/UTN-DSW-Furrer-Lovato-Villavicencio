import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entity/plan.entity';
import { PlanDuration } from './entity/plan-duration.entity';
import { PlanService } from './plan.service';
import { PlanDurationService } from './plan-duration.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanDuration])],
  controllers: [PlanController],
  providers: [PlanService, PlanDurationService],
  exports: [PlanService, PlanDurationService],
})
export class PlanModule {}
