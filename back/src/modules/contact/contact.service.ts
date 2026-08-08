import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entity/contact.entity';
import { MailService } from './mail.service';
import { ContactDto } from './dto/contact.dto';


@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly mailService: MailService,
  ) {}

  async create(contactDto: ContactDto): Promise<Contact> {
    const newContact = this.contactRepository.create(contactDto);
    const savedContact = await this.contactRepository.save(newContact);

    await this.mailService.sendContactNotification(contactDto);

    return savedContact;
  }

  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Contact | null> {
    return this.contactRepository.findOneBy({ id });
  }
}