import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entity/contact.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), MailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
