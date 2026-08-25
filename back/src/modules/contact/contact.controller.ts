import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact-dto';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';

@Controller('api/v1/contact')
@ApiTags('Contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public: the only route that stays reachable without a token.
  @Post()
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
