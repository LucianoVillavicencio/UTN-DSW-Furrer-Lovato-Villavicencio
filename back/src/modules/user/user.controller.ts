import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UsersDto } from './dto/users-dto';
import { UpdateProfileDto } from './dto/update-profile-dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
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
  
  // Self-service: cualquier usuario autenticado edita su propio perfil.
  // @Auth() a nivel método reemplaza el @Auth(Role.ADMIN) de la clase
  // (RolesGuard usa getAllAndOverride, así que el método gana) — sigue
  // exigiendo estar logueado, ya no exige rol admin.
  @Patch('me')
  @Auth()
  updateMyProfile(
    @ActiveUser() activeUser: UserActiveInterface,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(activeUser.sub, dto);
  }

  //Get all user
  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  // Búsqueda de usuarios por DNI, email o nombre/apellido (admin). Tiene
  // que declararse ANTES de '/:dni' — si no, Nest/Express toma "search"
  // como si fuera un valor de :dni y esta ruta nunca se alcanza.
  @Get('search')
  searchUsers(
    @Query('dni') dni?: string,
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('surname') surname?: string,
  ) {
    return this.userService.searchUsers({
      dni: dni ? Number(dni) : undefined,
      email,
      name,
      surname,
    });
  }

  //Get deleted user
  @Get('filter/deleted')
  getUsersDeleted() {
    return this.userService.findAllDeleted();
  }

  //Get one user by dni
  @Get('/:dni')
  getUserById(@Param('dni') dni: number) {
    return this.userService.findUser(dni);
  }

  // Edición por parte de un admin — ver AdminUpdateUserDto para por qué no
  // reutiliza el viejo PUT /user (UsersDto exige password en cada update).
  @Patch('/:dni')
  adminUpdateUser(
    @Param('dni', ParseIntPipe) dni: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.adminUpdateUser(dni, dto);
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
