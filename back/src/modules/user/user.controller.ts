import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile-dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import { AdminCreateUserDto } from './dto/admin-create-user-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

@Controller('api/v1/user')
@ApiTags('Usuarios')
// Declared at class level, so every endpoint is admin-only unless the handler
// overrides it with its own @Auth(Role.USER) (see updateMyProfile).
@Auth(Role.ADMIN)
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class UserController {
  constructor(private userService: UserService) {}

  // Front-desk creation of a member who may have neither email nor password.
  // The older UsersDto is still used by auth.service.register (via
  // createUsers).
  @Post()
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.userService.adminCreateUser(dto);
  }

  // Self-service: any authenticated user edits their own profile. A
  // method-level @Auth(Role.USER) replaces the class-level @Auth(Role.ADMIN)
  // because RolesGuard uses getAllAndOverride and the handler wins — a login
  // is still required, the admin role no longer is.
  @Patch('me')
  @Auth(Role.USER)
  updateMyProfile(
    @ActiveUser() activeUser: UserActiveInterface,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(activeUser.sub, dto);
  }

  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  // User search by DNI, email or name/surname (admin). It has to be declared
  // BEFORE '/:dni' or Nest/Express reads "search" as a :dni value and this
  // route is never reached.
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

  @Get('filter/deleted')
  getUsersDeleted() {
    return this.userService.findAllDeleted();
  }

  @Get('/:dni')
  getUserById(@Param('dni') dni: number) {
    return this.userService.findUser(dni);
  }

  // Admin-side edit — see AdminUpdateUserDto for why this did not reuse the
  // since-deleted PUT /user, whose UsersDto demanded a password on every
  // update.
  @Patch('/:dni')
  adminUpdateUser(
    @Param('dni', ParseIntPipe) dni: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.adminUpdateUser(dni, dto);
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
