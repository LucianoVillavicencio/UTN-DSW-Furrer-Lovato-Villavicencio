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
import { ClassService } from './class.service';
import { ClassDto } from './dto/class-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';

@Controller('api/v1/class')
@ApiTags('Classes')
// Not rate limited — see auth.throttle.ts.
@SkipThrottle(SKIP_ALL_THROTTLERS)

// The catalogue GETs stay public — the landing page and /class render them
// without a login. Everything that writes carries @Auth(Role.ADMIN).
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Auth(Role.ADMIN)
  createClass(@Body() classDto: ClassDto) {
    return this.classService.createClass(classDto);
  }

  // Public read: used by the /class pages and the session picker.
  @Get()
  getClasses() {
    return this.classService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getClassesDeleted() {
    return this.classService.findAllDeleted();
  }

  @Get('/:id')
  getClassById(@Param('id', ParseIntPipe) id: number) {
    return this.classService.findClass(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateClass(@Body() classDto: ClassDto) {
    return this.classService.updateClass(classDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deleteClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.deleteClass(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restoreClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.restoreClass(id);
  }
}
