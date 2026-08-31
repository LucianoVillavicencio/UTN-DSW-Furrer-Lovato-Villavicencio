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
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { SubscriptionDto } from './dto/subscription-dto';
import { ChangePlanDto } from './dto/change-plan-dto';
import { SetAutoRenewDto } from './dto/set-auto-renew-dto';
import { subscriptionService } from './subscription.service';
import { SavedCardService } from '../savedCard/savedCard.service';
import { isChargeable } from '../savedCard/savedCard.rules';
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
  constructor(
    private readonly subscriptionService: subscriptionService,
    private readonly savedCardService: SavedCardService,
  ) {}

  // Self-service: creates or renews the authenticated user's subscription on a
  // different plan. userId comes from the JWT, never from the body — see
  // ChangePlanDto.
  @Post('change-plan')
  @Auth(Role.USER)
  changePlan(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.changePlan(
      user.sub,
      dto.planId,
      dto.planTermId,
    );
  }

  // Assigns a plan to a member from the Users panel or the new-member wizard.
  // No extra @Auth: the class-level guard already restricts this to ADMIN.
  @Post('admin/:id')
  assignPlanToMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.assignPlanToMember(
      id,
      dto.planId,
      dto.planTermId,
    );
  }

  // Self-service: the authenticated user's active subscription, for the
  // dashboard's "Mi plan" tab. Before this there was no way to ask for "mine"
  // without pulling the full list of every user.
  @Get('me')
  @Auth(Role.USER)
  getMySubscription(@ActiveUser() user: UserActiveInterface) {
    return this.subscriptionService.findActiveForUser(user.sub);
  }

  // Self-service: toggles auto-renewal on the authenticated user's active
  // subscription. Turning it OFF is always allowed. Turning it ON is refused
  // without an active, chargeable card — auto-renewal without one is a
  // promise the system cannot keep. The check lives here, in the controller,
  // rather than in subscriptionService: this is the one place that can reach
  // both subscriptionService and SavedCardService without a circular module
  // import (SubscriptionModule imports SavedCardModule for exactly this;
  // SavedCardModule does not import SubscriptionModule back — see
  // savedCard.module.ts).
  @Patch('me/auto-renew')
  @Auth(Role.USER)
  async setAutoRenew(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: SetAutoRenewDto,
  ) {
    if (dto.autoRenew) {
      const card = await this.savedCardService.findActiveForUser(user.sub);
      if (!card || !isChargeable(card, new Date())) {
        throw new ConflictException(
          'Necesitás una tarjeta guardada para activar la renovación automática.',
        );
      }
    }

    const subscription = await this.subscriptionService.findActiveForUser(
      user.sub,
    );
    if (!subscription) {
      throw new NotFoundException('No tenés una suscripción activa.');
    }

    return this.subscriptionService.setAutoRenew(
      subscription.id,
      dto.autoRenew,
    );
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
