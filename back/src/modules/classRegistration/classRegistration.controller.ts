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


@Controller('api/v1/classRegistration')
@ApiTags('Class registration')
export class ClassRegistrationController {
  constructor(
    private readonly classRegistrationService: ClassRegistrationService,
  ) {}

  @Post()
  createClassRegistration(@Body() registrationClassDto: ClassRegistrationDto) {
    return this.classRegistrationService.createClassRegistration(registrationClassDto);
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
    return this.classRegistrationService.updateClassRegistration(registrationClassDto);
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
