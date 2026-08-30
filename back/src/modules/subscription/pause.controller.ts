import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { PauseService } from './pause.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

// Mounted at the SAME route prefix as subscriptionController
// ('api/v1/subscription'), from a different module and a different
// controller class. NestJS routes globally, not scoped to which module
// declared the controller, so this keeps the URL scheme
// (PATCH /api/v1/subscription/:id/pause) the design calls for without
// SubscriptionModule itself importing classRegistrationModule — which would
// create a circular module graph (SubscriptionModule -> classRegistrationModule
// -> SubscriptionModule). See pause.module.ts.
@Controller('api/v1/subscription')
@ApiTags('subscriptiones')
@Auth(Role.ADMIN)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class PauseController {
  constructor(private readonly pauseService: PauseService) {}

  // Freezes a membership (injury/travel). pausedById comes from the JWT, not
  // the body, same reasoning as createManualPayment's admin id.
  @Patch(':id/pause')
  pause(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() admin: UserActiveInterface,
  ) {
    return this.pauseService.pause(id, admin.sub);
  }

  @Patch(':id/unpause')
  unpause(@Param('id', ParseIntPipe) id: number) {
    return this.pauseService.unpause(id);
  }
}
