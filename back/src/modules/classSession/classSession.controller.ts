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
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLERS } from '../../auth/auth.throttle';
import {
  ClassSessionDto,
  WeeklyClassSessionsDto,
} from './dto/classSession-dto';
import { ClassSessionService } from './classSession.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';

// The reads stay public: the /class page renders the week's sessions without a
// login. Every write is ADMIN-only, like the rest of the catalogue modules —
// this controller had no guard at all, so anyone could create or delete a
// session.
@Controller('api/v1/classSession')
@ApiTags('Class Session')
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class ClassSessionController {
  constructor(private readonly classSessionService: ClassSessionService) {}

  @Post()
  @Auth(Role.ADMIN)
  createClassSession(@Body() classSessionDto: ClassSessionDto) {
    return this.classSessionService.createClassSession(classSessionDto);
  }

  // The whole weekly grid of one class in a single save.
  @Post('weekly')
  @Auth(Role.ADMIN)
  createWeeklySlots(@Body() dto: WeeklyClassSessionsDto) {
    return this.classSessionService.createWeeklySlots(dto);
  }

  @Get()
  getClassSession() {
    return this.classSessionService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getClassSessionDeleted() {
    return this.classSessionService.findAllDeleted();
  }

  @Get('/:id')
  getClassSessionById(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.findClassSession(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateClassSession(@Body() classSessionDto: ClassSessionDto) {
    return this.classSessionService.updateClassSession(classSessionDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deleteClassSession(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.deleteClassSession(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restoreClassSession(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.restoreClassSession(id);
  }
}
