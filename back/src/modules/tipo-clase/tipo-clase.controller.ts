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
import { TipoClaseService } from './tipo-clase.service';
import { TipoClaseDto } from './dto/tipo-clase-dto';

@Controller('api/v1/tipo-clase')
@ApiTags('Tipos de Clase')
export class TipoClaseController {
  constructor(private readonly tipoClaseService: TipoClaseService) {}

  @Post()
  createTipoClase(@Body() tipoClaseDto: TipoClaseDto) {
    return this.tipoClaseService.createTipoClase(tipoClaseDto);
  }

  @Get()
  getTiposClase() {
    return this.tipoClaseService.findAll();
  }

  @Get('filter/deleted')
  getTiposClaseDeleted() {
    return this.tipoClaseService.findAllDeleted();
  }

  @Get('/:id')
  getTipoClaseById(@Param('id', ParseIntPipe) id: number) {
    return this.tipoClaseService.findTipoClase(id);
  }

  @Put()
  updateTipoClase(@Body() tipoClaseDto: TipoClaseDto) {
    return this.tipoClaseService.updateTipoClase(tipoClaseDto);
  }

  @Delete('/:id')
  deleteTipoClase(@Param('id', ParseIntPipe) id: number) {
    return this.tipoClaseService.deleteTipoClase(id);
  }

  @Patch('/restore/:id')
  restoreTipoClase(@Param('id', ParseIntPipe) id: number) {
    return this.tipoClaseService.restoreTipoClase(id);
  }
}
