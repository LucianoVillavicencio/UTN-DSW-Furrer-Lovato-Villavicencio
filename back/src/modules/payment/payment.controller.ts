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
import { Role } from '../../common/enum/role.enum';

// The whole payment module is admin-only except /me (self-service, below):
// no public page depends on reading or writing someone else's payments.
@Controller('api/v1/Payment')
@ApiTags('Payments')
@Auth(Role.ADMIN)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Self-service: payment history of the authenticated user (see specs.md
  // §2.2/§3.5). userDni comes from the JWT, never from a param.
  @Get('me')
  @Auth(Role.USER)
  getMyPayments(@ActiveUser() user: UserActiveInterface) {
    return this.paymentService.findMineForUser(user.sub);
  }

  // In-person payment recorded by an admin (specs.md §3.5).
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

  // Payment history of one specific user (Users panel). Declared before
  // '/:id' for the same reason as 'search'/'by-user' in the other modules.
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
