import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ClassRegistrationService } from './classRegistration.service';
import { ClassRegistrationDto } from './dto/classRegistration-dto';
import { ChangeEnrollmentDto, EnrollClassDto } from './dto/enrollment-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/role.enum';

// Admin-only except the four self-service routes below. This controller used to
// have no guard at all: anyone could enroll anybody by putting a DNI in the
// body, and GET / returned every member's registrations along with their name,
// email and phone.
@Controller('api/v1/classRegistration')
@ApiTags('Class registration')
@Auth(Role.ADMIN)
export class ClassRegistrationController {
  constructor(
    private readonly classRegistrationService: ClassRegistrationService,
  ) {}

  // The classes page and the dashboard: what this member holds, what the plan
  // allows and how many changes are left this month.
  @Get('me')
  @Auth()
  getMyEnrollments(@ActiveUser() user: UserActiveInterface) {
    return this.classRegistrationService.findMyEnrollments(user.sub);
  }

  // Books a class at an hour, on every weekday it runs at that hour.
  @Post('enroll')
  @Auth()
  enroll(@ActiveUser() user: UserActiveInterface, @Body() dto: EnrollClassDto) {
    return this.classRegistrationService.enroll(user.sub, dto);
  }

  // Moves the member to another class or hour, spending one of the monthly
  // changes when the plan is limited.
  @Put('me')
  @Auth()
  changeMyEnrollment(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: ChangeEnrollmentDto,
  ) {
    return this.classRegistrationService.changeEnrollment(user.sub, dto);
  }

  @Delete('enrollment/:group')
  @Auth()
  cancelMyEnrollment(
    @ActiveUser() user: UserActiveInterface,
    @Param('group') group: string,
  ) {
    return this.classRegistrationService.cancelEnrollment(user.sub, group);
  }

  @Post()
  createClassRegistration(@Body() registrationClassDto: ClassRegistrationDto) {
    return this.classRegistrationService.createClassRegistration(
      registrationClassDto,
    );
  }

  @Get()
  getClassRegistration() {
    return this.classRegistrationService.findAll();
  }

  @Get('filter/deleted')
  getClassRegistrationDeleted() {
    return this.classRegistrationService.findAllDeleted();
  }

  @Get('/:id')
  getClassRegistrationById(@Param('id', ParseIntPipe) id: number) {
    return this.classRegistrationService.findClassRegistration(id);
  }

  @Put()
  updateClassRegistration(@Body() registrationClassDto: ClassRegistrationDto) {
    return this.classRegistrationService.updateClassRegistration(
      registrationClassDto,
    );
  }

  @Delete('/:id')
  deleteClassRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.classRegistrationService.deleteClassRegistration(id);
  }

  @Patch('/restore/:id')
  restoreClassRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.classRegistrationService.restoreClassRegistration(id);
  }
}
