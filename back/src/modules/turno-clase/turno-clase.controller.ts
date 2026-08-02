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
import { TurnoClaseService } from './turno-clase.service';
import { TurnoClaseDto } from './dto/turno-clase-dto';

@Controller('api/v1/turno-clase')
@ApiTags('Turnos de Clase')
export class TurnoClaseController {
  constructor(private readonly turnoClaseService: TurnoClaseService) {}

  @Post()
  createTurnoClase(@Body() turnoClaseDto: TurnoClaseDto) {
    return this.turnoClaseService.createTurnoClase(turnoClaseDto);
  }

  @Get()
  getTurnosClase() {
    return this.turnoClaseService.findAll();
  }

  @Get('filter/deleted')
  getTurnosClaseDeleted() {
    return this.turnoClaseService.findAllDeleted();
  }

  @Get('/:id')
  getTurnoClaseById(@Param('id', ParseIntPipe) id: number) {
    return this.turnoClaseService.findTurnoClase(id);
  }

  @Put()
  updateTurnoClase(@Body() turnoClaseDto: TurnoClaseDto) {
    return this.turnoClaseService.updateTurnoClase(turnoClaseDto);
  }

  @Delete('/:id')
  deleteTurnoClase(@Param('id', ParseIntPipe) id: number) {
    return this.turnoClaseService.deleteTurnoClase(id);
  }

  @Patch('/restore/:id')
  restoreTurnoClase(@Param('id', ParseIntPipe) id: number) {
    return this.turnoClaseService.restoreTurnoClase(id);
  }
}
