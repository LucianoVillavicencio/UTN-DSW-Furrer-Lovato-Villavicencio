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
import { InscripcionClaseService } from './inscripcion-clase.service';
import { InscripcionClaseDto } from './dto/inscripcion-clase-dto';

@Controller('api/v1/inscripcion-clase')
@ApiTags('Inscripciones a Clases')
export class InscripcionClaseController {
  constructor(private readonly inscripcionClaseService: InscripcionClaseService) {}

  @Post()
  createInscripcionClase(@Body() inscripcionDto: InscripcionClaseDto) {
    return this.inscripcionClaseService.createInscripcionClase(inscripcionDto);
  }

  @Get()
  getInscripcionesClase() {
    return this.inscripcionClaseService.findAll();
  }

  @Get('filter/deleted')
  getInscripcionesClaseDeleted() {
    return this.inscripcionClaseService.findAllDeleted();
  }

  @Get('/:id')
  getInscripcionClaseById(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionClaseService.findInscripcionClase(id);
  }

  @Put()
  updateInscripcionClase(@Body() inscripcionDto: InscripcionClaseDto) {
    return this.inscripcionClaseService.updateInscripcionClase(inscripcionDto);
  }

  @Delete('/:id')
  deleteInscripcionClase(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionClaseService.deleteInscripcionClase(id);
  }

  @Patch('/restore/:id')
  restoreInscripcionClase(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionClaseService.restoreInscripcionClase(id);
  }
}
