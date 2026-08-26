import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanTerm } from './entity/planTerm.entity';
import { PlanTermService } from './planTerm.service';
import { PlanTermController } from './planTerm.controller';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlanTerm]), PlanModule],
  controllers: [PlanTermController],
  providers: [PlanTermService],
  exports: [PlanTermService],
})
export class PlanTermModule {}
