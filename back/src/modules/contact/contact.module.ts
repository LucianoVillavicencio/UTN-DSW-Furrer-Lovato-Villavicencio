import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entity/contact.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MailService } from './mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactController],
  providers: [ContactService, MailService],
})
export class ContactModule {}
