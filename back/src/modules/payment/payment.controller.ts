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
import { PaymentService } from './payment.service';
import { PaymentDto } from './dto/payment-dto';
import { ManualPaymentDto } from './dto/manual-payment-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/rol.enum';

// Todo el módulo de pagos es admin-only salvo /me (self-service, ver abajo):
// no hay ninguna página pública que dependa de leer/escribir pagos ajenos.
@Controller('api/v1/Payment')
@ApiTags('Payments')
@Auth(Role.ADMIN)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Self-service: historial de pagos del usuario autenticado (ver
  // specs.md §2.2/§3.5). userDni sale del JWT, nunca de un param.
  @Get('me')
  @Auth()
  getMyPayments(@ActiveUser() user: UserActiveInterface) {
    return this.paymentService.findMineForUser(user.sub);
  }

  // Pago presencial cargado por un admin (specs.md §3.5).
  @Post('manual')
  createManualPayment(
    @ActiveUser() admin: UserActiveInterface,
    @Body() dto: ManualPaymentDto,
  ) {
    return this.paymentService.createManualPayment(dto, admin.sub);
  }

  @Post()
  createPayment(@Body() paymentDto: PaymentDto) {
    return this.paymentService.createPayment(paymentDto);
  }

  @Get()
  getPayments() {
    return this.paymentService.findAll();
  }

  @Get('filter/deleted')
  getPaymentsDeleted() {
    return this.paymentService.findAllDeleted();
  }

  // Historial de pagos de un usuario puntual (panel de Usuarios). Antes de
  // '/:id' por el mismo motivo que 'search'/'by-user' en los otros módulos.
  @Get('by-user/:dni')
  getPaymentsByUser(@Param('dni', ParseIntPipe) dni: number) {
    return this.paymentService.findByUser(dni);
  }

  @Get('/:id')
  getPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findPayment(id);
  }

  @Put()
  updatePayment(@Body() paymentDto: PaymentDto) {
    return this.paymentService.updatePayment(paymentDto);
  }

  @Delete('/:id')
  deletePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.deletePayment(id);
  }

  @Patch('/restore/:id')
  restorePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.restorePayment(id);
  }
}
