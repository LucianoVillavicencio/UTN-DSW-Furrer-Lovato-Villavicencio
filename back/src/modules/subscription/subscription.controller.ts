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
import { SubscriptionDto } from './dto/subscription-dto';
import { ChangePlanDto } from './dto/change-plan-dto';
import { subscriptionService } from './subscription.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

// Admin-only except /change-plan and /me (self-service, below). This
// controller used to have no guard at all: anyone could list every
// subscription — with each user's name, email and phone — or edit them.
@Controller('api/v1/subscription')
@ApiTags('subscriptiones')
@Auth(Role.ADMIN)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class subscriptionController {
  constructor(private readonly subscriptionService: subscriptionService) {}

  // Self-service: creates or renews the authenticated user's subscription on a
  // different plan. userId comes from the JWT, never from the body — see
  // ChangePlanDto.
  @Post('change-plan')
  @Auth(Role.USER)
  changePlan(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.changePlan(user.sub, dto.planId);
  }

  // Assigns a plan to a member from the Users panel or the new-member wizard.
  // No extra @Auth: the class-level guard already restricts this to ADMIN.
  @Post('admin/:id')
  assignPlanToMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.assignPlanToMember(id, dto.planId);
  }

  // Self-service: the authenticated user's active subscription, for the
  // dashboard's "Mi plan" tab. Before this there was no way to ask for "mine"
  // without pulling the full list of every user.
  @Get('me')
  @Auth(Role.USER)
  getMySubscription(@ActiveUser() user: UserActiveInterface) {
    return this.subscriptionService.findActiveForUser(user.sub);
  }

  @Post()
  createSubscription(@Body() subscriptionDto: SubscriptionDto) {
    return this.subscriptionService.createSubscription(subscriptionDto);
  }

  @Get()
  getSubscriptiones() {
    return this.subscriptionService.findAll();
  }

  @Get('filter/deleted')
  getSubscriptionesDeleted() {
    return this.subscriptionService.findAllDeleted();
  }

  // Subscription history of one specific user (Users panel). Declared before
  // '/:id' — same reason as /search in UserController.
  @Get('by-user/:id')
  getSubscriptionsByUser(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.findByUser(id);
  }

  @Get('/:id')
  getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.findSubscription(id);
  }

  @Put()
  updateSubscription(@Body() subscriptionDto: SubscriptionDto) {
    return this.subscriptionService.updateSubscription(subscriptionDto);
  }

  @Delete('/:id')
  deleteSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.deleteSubscription(id);
  }

  @Patch('/restore/:id')
  restoreSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.restoreSubscription(id);
  }
}
