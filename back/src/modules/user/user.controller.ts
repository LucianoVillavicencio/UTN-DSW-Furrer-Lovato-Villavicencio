
import { Controller , Body , Post , Get ,Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UsersDto } from './dto/users-dto';



@Controller('api/v1/user')
@ApiTags('Usuarios')
export class UserController {

    constructor(private userService:UserService){}

    //create user
    @Post()
    createUsers(@Body() user: UsersDto){

        return this.userService.createUsers(user);

    }

    //get one user
    @Get('/:id')
    getUserById(@Param('id') idUsuario: number){

        return this.userService.findUser(idUsuario);
    }

    //get all user
    @Get()
    getUsers(){

        return this.userService.findAll();
    }
    

    //get deleted user
    @Get('filter/deleted')
    getUsersDeleted(){
        return this.userService.findAllDeleted();
    }








}

