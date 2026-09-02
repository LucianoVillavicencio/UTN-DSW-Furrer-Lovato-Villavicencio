import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentReceiptPrint } from './entity/payment-receipt-print.entity';
import { ReceiptPrintService } from './receipt-print.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

// Leaf module, same shape as MercadoPagoModule: no controllers, imported by
// PaymentModule to print the cash/transferencia informational ticket after
// a payment is recorded.
@Module({
  imports: [TypeOrmModule.forFeature([PaymentReceiptPrint]), MercadoPagoModule],
  providers: [ReceiptPrintService],
  exports: [ReceiptPrintService],
})
export class ReceiptModule {}
