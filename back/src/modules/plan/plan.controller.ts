import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { PlanDto } from './dto/plan-dto';

@Controller('api/v1/plan')
@ApiTags('Planes')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  createPlan(@Body() planDto: PlanDto) {
    return this.planService.createPlan(planDto);
  }

  @Get()
  getPlanes() {
    return this.planService.findAll();
  }

  @Get('filter/deleted')
  getPlanesDeleted() {
    return this.planService.findAllDeleted();
  }

  @Get('/:id')
  getPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findPlan(id);
  }

  @Put()
  updatePlan(@Body() planDto: PlanDto) {
    return this.planService.updatePlan(planDto);
  }

  @Delete('/:id')
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.planService.deletePlan(id);
  }

  @Patch('/restore/:id')
  restorePlan(@Param('id', ParseIntPipe) id: number) {
    return this.planService.restorePlan(id);
  }
}
