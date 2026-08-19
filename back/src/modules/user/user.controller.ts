import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UsersDto } from './dto/users-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/rol.enum';

@Controller('api/v1/user')
@ApiTags('Usuarios')


//Al ponerlo arriba ya protege todos los endpoints. Es igual que ponerlo en cada uno
@Auth(Role.ADMIN)

export class UserController {
  constructor(private userService: UserService) {}

  //Create user
  @Post()
  createUsers(@Body() user: UsersDto) {
    return this.userService.createUsers(user);
  }
  
  //Get one user by dni
  @Get('/:dni')
  getUserById(@Param('dni') dni: number) {
    return this.userService.findUser(dni);
  }

  //Get all user
  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  //Get deleted user
  @Get('filter/deleted')
  getUsersDeleted() {
    return this.userService.findAllDeleted();
  }


  //Update user
  @Put()
  updateUsers(@Body() user: UsersDto) {
    return this.userService.updateUsers(user);
  }


  //Delete user
  @Delete('/:dni')
  deleteUsers(@Param('dni') dni: number) {
    return this.userService.deleteUsers(dni);
  }


  // Restore user
  @Patch('/restore/:dni')
  restoreUsers(@Param('dni') dni: number) {
    return this.userService.restoreUsers(dni);
  }
}
