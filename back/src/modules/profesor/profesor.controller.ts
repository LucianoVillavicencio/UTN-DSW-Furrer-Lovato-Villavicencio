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
import { ProfesorService } from './profesor.service';
import { ProfesorDto } from './dto/profesor-dto';

@Controller('api/v1/profesor')
@ApiTags('Profesores')
export class ProfesorController {
  constructor(private readonly profesorService: ProfesorService) {}

  @Post()
  createProfesor(@Body() profesorDto: ProfesorDto) {
    return this.profesorService.createProfesor(profesorDto);
  }

  @Get()
  getProfesores() {
    return this.profesorService.findAll();
  }

  @Get('filter/deleted')
  getProfesoresDeleted() {
    return this.profesorService.findAllDeleted();
  }

  @Get('/:dni')
  getProfesorByDni(@Param('dni', ParseIntPipe) dni: number) {
    return this.profesorService.findProfesor(dni);
  }

  @Put()
  updateProfesor(@Body() profesorDto: ProfesorDto) {
    return this.profesorService.updateProfesor(profesorDto);
  }

  @Delete('/:dni')
  deleteProfesor(@Param('dni', ParseIntPipe) dni: number) {
    return this.profesorService.deleteProfesor(dni);
  }

  @Patch('/restore/:dni')
  restoreProfesor(@Param('dni', ParseIntPipe) dni: number) {
    return this.profesorService.restoreProfesor(dni);
  }
}
