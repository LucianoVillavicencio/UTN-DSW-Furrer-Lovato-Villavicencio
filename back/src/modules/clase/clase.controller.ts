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
import { ClaseService } from './clase.service';
import { ClaseDto } from './dto/clase-dto';

@Controller('api/v1/clase')
@ApiTags('Clases')
export class ClaseController {
  constructor(private readonly claseService: ClaseService) {}

  @Post()
  createClase(@Body() claseDto: ClaseDto) {
    return this.claseService.createClase(claseDto);
  }

  @Get()
  getClases() {
    return this.claseService.findAll();
  }

  @Get('filter/deleted')
  getClasesDeleted() {
    return this.claseService.findAllDeleted();
  }

  @Get('/:id')
  getClaseById(@Param('id', ParseIntPipe) id: number) {
    return this.claseService.findClase(id);
  }

  @Put()
  updateClase(@Body() claseDto: ClaseDto) {
    return this.claseService.updateClase(claseDto);
  }

  @Delete('/:id')
  deleteClase(@Param('id', ParseIntPipe) id: number) {
    return this.claseService.deleteClase(id);
  }

  @Patch('/restore/:id')
  restoreClase(@Param('id', ParseIntPipe) id: number) {
    return this.claseService.restoreClase(id);
  }
}
