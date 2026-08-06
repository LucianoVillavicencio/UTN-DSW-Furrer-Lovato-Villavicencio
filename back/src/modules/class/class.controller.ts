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
import { ClassService } from './class.service';
import { ClassDto } from './dto/class-dto';

@Controller('api/v1/class')
@ApiTags('Classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  createClass(@Body() claseDto: ClassDto) {
    return this.classService.createClass(claseDto);
  }

  @Get()
  getClasses() {
    return this.classService.findAll();
  }

  @Get('filter/deleted')
  getClassesDeleted() {
    return this.classService.findAllDeleted();
  }

  @Get('/:id')
  getClassById(@Param('id', ParseIntPipe) id: number) {
    return this.classService.findClass(id);
  }

  @Put()
  updateClass(@Body() claseDto: ClassDto) {
    return this.classService.updateClass(claseDto);
  }

  @Delete('/:id')
  deleteClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.deleteClass(id);
  }

  @Patch('/restore/:id')
  restoreClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.restoreClass(id);
  }
}
