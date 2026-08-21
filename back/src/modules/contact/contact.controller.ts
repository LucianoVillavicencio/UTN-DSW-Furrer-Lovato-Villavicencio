import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact-dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/v1/contact')
@ApiTags('Contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  createContact(@Body() contactDto: ContactDto) {
    return this.contactService.create(contactDto);
  }

  @Get()
  getContacts() {
    return this.contactService.findAll();
  }

  @Get(':id')
  getContactById(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }
}
