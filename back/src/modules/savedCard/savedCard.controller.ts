import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { SavedCardService } from './savedCard.service';
import { SaveCardDto } from './dto/save-card-dto';
import { toPublicCard } from './savedCard.mapper';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

// Every route here is member self-service — unlike payment.controller.ts or
// subscription.controller.ts, there is no admin surface for another
// member's saved card, so the whole controller is @Auth(Role.USER).
@Controller('api/v1/saved-card')
@ApiTags('Saved Card')
@Auth(Role.USER)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class SavedCardController {
  constructor(private readonly savedCardService: SavedCardService) {}

  // Never returns mpCardId or mpCustomerId — the browser has no legitimate
  // use for them and they identify a real payment instrument. Returns null
  // (not a 404) when the member has no active card yet: that's a normal
  // state, not an error. Filtering goes through the shared toPublicCard
  // mapper — see savedCard.mapper.ts — the same one saveCard uses below, so
  // this response shape can't drift out of sync with that one.
  @Get()
  async getMyCard(@ActiveUser() user: UserActiveInterface) {
    const card = await this.savedCardService.findActiveForUser(user.sub);
    return card ? toPublicCard(card) : null;
  }

  // The email comes from the JWT, never the body — see SaveCardDto. The
  // response is filtered through toPublicCard just like getMyCard's: the
  // freshly-saved row still carries mpCardId/mpCustomerId, and returning it
  // unfiltered would leak them the moment a card is saved, not just on
  // every later read.
  @Post()
  async saveCard(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: SaveCardDto,
  ) {
    const card = await this.savedCardService.saveForUser(
      user.sub,
      user.email,
      dto.cardToken,
    );
    return toPublicCard(card);
  }

  @Delete('/:id')
  removeCard(
    @ActiveUser() user: UserActiveInterface,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.savedCardService.removeForUser(id, user.sub);
  }
}
