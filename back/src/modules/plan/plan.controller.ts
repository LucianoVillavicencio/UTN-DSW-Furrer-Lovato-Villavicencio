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
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/rol.enum';

@Controller('api/v1/plan')
@ApiTags('Planes')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Auth(Role.ADMIN)
  createPlan(@Body() planDto: PlanDto) {
    return this.planService.createPlan(planDto);
  }

  // Lectura pública: la usan /membership y el picker de "Mi plan".
  @Get()
  getPlans() {
    return this.planService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getPlansDeleted() {
    return this.planService.findAllDeleted();
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
