import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from "./entity/users.entity";
import { Repository } from 'typeorm';

@Injectable()
export class UserService {

    constructor(@InjectRepository(Users) private usersRepository:Repository <Users>) {

    }
}
