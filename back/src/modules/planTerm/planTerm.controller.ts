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
import { PlanTermService } from './planTerm.service';
import { PlanTermDto } from './dto/planTerm-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';

// Admin-only by default, same deny-by-default pattern as every sibling
// controller: a route added here later without its own @Auth is still
// guarded. The one member-facing route (GET by-plan/:planId) widens to
// Role.USER with a method-level override.
@Controller('api/v1/plan-term')
@ApiTags('Plazos de plan')
@Auth(Role.ADMIN)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class PlanTermController {
  constructor(private readonly planTermService: PlanTermService) {}

  @Post()
  @Auth(Role.ADMIN)
  createTerm(@Body() planTermDto: PlanTermDto) {
    return this.planTermService.createTerm(planTermDto);
  }

  @Get()
  @Auth(Role.ADMIN)
  getTerms() {
    return this.planTermService.findAll();
  }

  // Any authenticated member can see the discounted terms available for a
  // plan they're considering — used by the plan-change / checkout flow.
  @Get('by-plan/:planId')
  @Auth(Role.USER)
  getTermsByPlan(@Param('planId', ParseIntPipe) planId: number) {
    return this.planTermService.findForPlan(planId);
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getTermsDeleted() {
    return this.planTermService.findAllDeleted();
  }

  @Get('/:id')
  @Auth(Role.ADMIN)
  getTermById(@Param('id', ParseIntPipe) id: number) {
    return this.planTermService.findTerm(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateTerm(@Body() planTermDto: PlanTermDto) {
    return this.planTermService.updateTerm(planTermDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deleteTerm(@Param('id', ParseIntPipe) id: number) {
    return this.planTermService.deleteTerm(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restoreTerm(@Param('id', ParseIntPipe) id: number) {
    return this.planTermService.restoreTerm(id);
  }
}
