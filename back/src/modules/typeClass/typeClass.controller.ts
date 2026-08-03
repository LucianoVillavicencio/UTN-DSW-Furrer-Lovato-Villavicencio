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
import { TypeClassDto } from './dto/typeClass-dto';
import { TypeClassService } from './typeClass.service';

@Controller('api/v1/typeClass')
@ApiTags('Types of classes')
export class TypeClassController {
  constructor(private readonly typeClassService: TypeClassService) {}

  @Post()
  createTypeClass(@Body() typeClassDto: TypeClassDto) {
    return this.typeClassService.createTypeClass(typeClassDto);
  }

  @Get()
  getTypesClass() {
    return this.typeClassService.findAll();
  }

  @Get('filter/deleted')
  getTypeClassDeleted() {
    return this.typeClassService.findAllDeleted();
  }

  @Get('/:id')
  getTypeClassById(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.findTypeClass(id);
  }

  @Put()
  updateTypeClass(@Body() typeClassDto: TypeClassDto) {
    return this.typeClassService.updateTypeClass(typeClassDto);
  }

  @Delete('/:id')
  deleteTypeClass(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.deleteTypeClass(id);
  }

  @Patch('/restore/:id')
  restoreTypeClass(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.restoreTypeClass(id);
  }
}
