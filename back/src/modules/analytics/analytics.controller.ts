import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_CONTACT_THROTTLE } from '../../auth/auth.throttle';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query-dto';
import { OwnerPasswordGuard } from './analytics.guard';

@Controller('api/v1/analytics')
@ApiTags('Analytics')
@Auth(Role.ADMIN)
// NOT SkipThrottle(SKIP_ALL_THROTTLERS) like the other admin controllers: this
// is a password endpoint, so it keeps AUTH_THROTTLE's five attempts a minute
// per address. Without it, an admin token plus unlimited guesses cracks a
// password a human chose.
@SkipThrottle(SKIP_CONTACT_THROTTLE)
@UseGuards(OwnerPasswordGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // POST for a read, deliberately: the request carries a secret, and a secret
  // must not appear in a URL that SecurityLogInterceptor writes to the log.
  // A useful side effect — the interceptor records "POST /api/v1/analytics/
  // overview" for every admin who opens the panel, and never the body.
  @Post('overview')
  getOverview(@Body() dto: AnalyticsQueryDto) {
    return this.analyticsService.buildOverview(dto);
  }
}
