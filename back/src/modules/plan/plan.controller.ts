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
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { PlanService } from './plan.service';
import { PlanDurationService } from './plan-duration.service';
import { PlanDto } from './dto/plan-dto';
import { PlanDurationDto } from './dto/plan-duration-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';

@Controller('api/v1/plan')
@ApiTags('Planes')
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly planDurationService: PlanDurationService,
  ) {}

  @Post()
  @Auth(Role.ADMIN)
  createPlan(@Body() planDto: PlanDto) {
    return this.planService.createPlan(planDto);
  }

  // Public read: used by /membership and the "Mi plan" picker.
  @Get()
  getPlans() {
    return this.planService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getPlansDeleted() {
    return this.planService.findAllDeleted();
  }

  // Durations are admin-only on purpose, including the read: the public plans
  // page and GET /plan must keep returning exactly what they return today, so
  // multi-month pricing does not reach the marketing surface.
  @Get('/:id/duration')
  @Auth(Role.ADMIN)
  getPlanDurations(@Param('id', ParseIntPipe) id: number) {
    return this.planDurationService.findByPlan(id);
  }

  @Post('/:id/duration')
  @Auth(Role.ADMIN)
  createPlanDuration(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PlanDurationDto,
  ) {
    return this.planDurationService.create(id, dto);
  }

  @Put('/:id/duration/:durationId')
  @Auth(Role.ADMIN)
  updatePlanDuration(
    @Param('id', ParseIntPipe) id: number,
    @Param('durationId', ParseIntPipe) durationId: number,
    @Body() dto: PlanDurationDto,
  ) {
    return this.planDurationService.update(id, durationId, dto);
  }

  @Delete('/:id/duration/:durationId')
  @Auth(Role.ADMIN)
  deletePlanDuration(
    @Param('id', ParseIntPipe) id: number,
    @Param('durationId', ParseIntPipe) durationId: number,
  ) {
    return this.planDurationService.remove(id, durationId);
  }

  @Get('/:id')
  getPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findPlan(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updatePlan(@Body() planDto: PlanDto) {
    return this.planService.updatePlan(planDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.planService.deletePlan(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restorePlan(@Param('id', ParseIntPipe) id: number) {
    return this.planService.restorePlan(id);
  }
}
