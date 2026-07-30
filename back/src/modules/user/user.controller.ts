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
import { LoginDto, UsersDto } from './dto/users-dto';

@Controller('api/v1/user')
@ApiTags('Usuarios')
export class UserController {
  constructor(private userService: UserService) {}

  //create user
  @Post()
  createUsers(@Body() user: UsersDto) {
    return this.userService.createUsers(user);
  }

  //login user
  @Post('/login')
  loginUser(@Body() loginDto: LoginDto) {
    return this.userService.loginUser(loginDto);
  }

  //get one user
  @Get('/:dni')
  getUserById(@Param('dni') dni: number) {
    return this.userService.findUser(dni);
  }

  //get all user
  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  //get deleted user
  @Get('filter/deleted')
  getUsersDeleted() {
    return this.userService.findAllDeleted();
  }

  @Put()
  updateUsers(@Body() user: UsersDto) {
    return this.userService.updateUsers(user);
  }

  @Delete('/:dni')
  deleteUsers(@Param('dni') dni: number) {
    return this.userService.deleteUsers(dni);
  }

  @Patch('/restore/:dni')
  restoreUsers(@Param('dni') dni: number) {
    return this.userService.restoreUsers(dni);
  }
}
