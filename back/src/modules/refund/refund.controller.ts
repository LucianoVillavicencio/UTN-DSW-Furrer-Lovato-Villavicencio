import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { RefundService } from './refund.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

// Admin-only throughout, and deliberately so: a refund is requested in
// person (the member hands back their card, or the admin agrees to cancel
// at the counter) and issued by the admin standing there. There is no
// member-facing route anywhere in this controller — no route here ever lets
// a member move money outward on their own.
@Controller('api/v1/refund')
@ApiTags('Refunds')
@Auth(Role.ADMIN)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  // Pure read the admin screen shows before anything happens.
  @Get('quote/:subscriptionId')
  quote(@Param('subscriptionId', ParseIntPipe) subscriptionId: number) {
    return this.refundService.quote(subscriptionId);
  }

  // Moves money (or records a cash refund) and cancels the membership.
  // adminId comes from the JWT, same reasoning as pause's admin id.
  @Post(':subscriptionId')
  issue(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
    @ActiveUser() admin: UserActiveInterface,
  ) {
    return this.refundService.issue(subscriptionId, admin.sub);
  }
}
