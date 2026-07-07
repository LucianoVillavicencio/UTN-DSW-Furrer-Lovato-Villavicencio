import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from "./entity/users.entity";
import { Repository } from 'typeorm';
import { UsersDto } from './dto/users-dto';

@Injectable()
export class UserService {

    constructor(@InjectRepository(Users) private usersRepository:Repository <Users>) {}

    async createUsers(user : UsersDto){

        const userExists = await this.findUser(user.idUsuario);

        if(userExists){

            throw new ConflictException('El usuario con ID: ' + user.idUsuario + 'existe.')
        } else {
            return await this.usersRepository.save(user);
        }

    }

    async findUser(idUsuario: number){

        return await this.usersRepository.findOne({ where: {idUsuario}});

    }

    async findAll(){

        return await this.usersRepository.find({where : {deleted : false}});

    }


    // Users deleted
    async findAllDeleted(){ 

        return await this.usersRepository.find({where : {deleted : true}});
        
    }
}
