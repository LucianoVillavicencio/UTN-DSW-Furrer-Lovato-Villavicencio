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
import { ClassSessionDto } from './dto/classSession-dto';
import { ClassSessionService } from './classSession.service';

@Controller('api/v1/classSession')
@ApiTags('Class Session')
export class ClassSessionController {
  constructor(private readonly classSessionService: ClassSessionService) {}

  @Post()
  createClassSession(@Body() classSessionDto: ClassSessionDto) {
    return this.classSessionService.createClassSession(classSessionDto);
  }

  @Get()
  getClassSession() {
    return this.classSessionService.findAll();
  }

  @Get('filter/deleted')
  getClassSessionDeleted() {
    return this.classSessionService.findAllDeleted();
  }

  @Get('/:id')
  getClassSessionById(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.findClassSession(id);
  }

  @Put()
  updateClassSession(@Body() classSessionDto: ClassSessionDto) {
    return this.classSessionService.updateClassSession(classSessionDto);
  }

  @Delete('/:id')
  deleteClassSession(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.deleteClassSession(id);
  }

  @Patch('/restore/:id')
  restoreClassSession(@Param('id', ParseIntPipe) id: number) {
    return this.classSessionService.restoreClassSession(id);
  }
}
