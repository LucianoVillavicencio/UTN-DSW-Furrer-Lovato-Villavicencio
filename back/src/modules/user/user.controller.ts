import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('api/v1/user')
@ApiTags('Usuarios')
export class UserController {

    constructor(private userService:UserService){

    }
}

