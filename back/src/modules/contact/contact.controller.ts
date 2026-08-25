import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact-dto';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import { CONTACT_THROTTLE } from '../../auth/auth.throttle';

@Controller('api/v1/contact')
@ApiTags('Contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public: the only route that stays reachable without a token.
  @Post()
  @Throttle({
    contact: { limit: CONTACT_THROTTLE.limit, ttl: CONTACT_THROTTLE.ttl },
  })
  createContact(@Body() contactDto: ContactDto) {
    return this.contactService.create(contactDto);
  }

  @Get()
  @Auth(Role.ADMIN)
  getContacts() {
    return this.contactService.findAll();
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  getContactById(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }
}
