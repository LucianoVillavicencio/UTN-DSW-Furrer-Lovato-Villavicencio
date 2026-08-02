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
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionDto } from './dto/suscripcion-dto';

@Controller('api/v1/suscripcion')
@ApiTags('Suscripciones')
export class SuscripcionController {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  @Post()
  createSuscripcion(@Body() suscripcionDto: SuscripcionDto) {
    return this.suscripcionService.createSuscripcion(suscripcionDto);
  }

  @Get()
  getSuscripciones() {
    return this.suscripcionService.findAll();
  }

  @Get('filter/deleted')
  getSuscripcionesDeleted() {
    return this.suscripcionService.findAllDeleted();
  }

  @Get('/:id')
  getSuscripcionById(@Param('id', ParseIntPipe) id: number) {
    return this.suscripcionService.findSuscripcion(id);
  }

  @Put()
  updateSuscripcion(@Body() suscripcionDto: SuscripcionDto) {
    return this.suscripcionService.updateSuscripcion(suscripcionDto);
  }

  @Delete('/:id')
  deleteSuscripcion(@Param('id', ParseIntPipe) id: number) {
    return this.suscripcionService.deleteSuscripcion(id);
  }

  @Patch('/restore/:id')
  restoreSuscripcion(@Param('id', ParseIntPipe) id: number) {
    return this.suscripcionService.restoreSuscripcion(id);
  }
}
