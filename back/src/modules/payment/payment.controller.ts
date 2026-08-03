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

@Controller('api/v1/Payment')
@ApiTags('Payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
