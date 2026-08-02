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
import { PagoService } from './pago.service';
import { PagoDto } from './dto/pago-dto';

@Controller('api/v1/pago')
@ApiTags('Pagos')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @Post()
  createPago(@Body() pagoDto: PagoDto) {
    return this.pagoService.createPago(pagoDto);
  }

  @Get()
  getPagos() {
    return this.pagoService.findAll();
  }

  @Get('filter/deleted')
  getPagosDeleted() {
    return this.pagoService.findAllDeleted();
  }

  @Get('/:id')
  getPagoById(@Param('id', ParseIntPipe) id: number) {
    return this.pagoService.findPago(id);
  }

  @Put()
  updatePago(@Body() pagoDto: PagoDto) {
    return this.pagoService.updatePago(pagoDto);
  }

  @Delete('/:id')
  deletePago(@Param('id', ParseIntPipe) id: number) {
    return this.pagoService.deletePago(id);
  }

  @Patch('/restore/:id')
  restorePago(@Param('id', ParseIntPipe) id: number) {
    return this.pagoService.restorePago(id);
  }
}
