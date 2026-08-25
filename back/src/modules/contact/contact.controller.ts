import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact-dto';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import {
  CONTACT_THROTTLE,
  SKIP_ALL_THROTTLERS,
  SKIP_AUTH_THROTTLE,
} from '../../auth/auth.throttle';

@Controller('api/v1/contact')
@ApiTags('Contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public: the only route that stays reachable without a token. It carries
  // CONTACT_THROTTLE and opts out of AUTH_THROTTLE — see auth.throttle.ts.
  @Post()
  @Throttle({
    contact: { limit: CONTACT_THROTTLE.limit, ttl: CONTACT_THROTTLE.ttl },
  })
  @SkipThrottle(SKIP_AUTH_THROTTLE)
  createContact(@Body() contactDto: ContactDto) {
    return this.contactService.create(contactDto);
  }

  // The admin reads are not the abuse target the POST is, and the cap above
  // would otherwise apply to them too — see auth.throttle.ts.
  @Get()
  @Auth(Role.ADMIN)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  getContacts() {
    return this.contactService.findAll();
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @SkipThrottle(SKIP_ALL_THROTTLERS)
  getContactById(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }
}
