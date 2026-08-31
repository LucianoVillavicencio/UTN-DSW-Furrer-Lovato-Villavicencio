import { Module } from '@nestjs/common';
import { MercadoPagoClient } from './mercadopago.client';
import { MercadoPagoConfig } from './mercadopago.config';

/**
 * Pure leaf module: `MercadoPagoConfig` + `MercadoPagoClient` only, no
 * controllers, never imports another feature module. The webhook receiver
 * (Task 14) lives in its own `MercadoPagoWebhookModule` instead of here,
 * specifically so this module can be imported by every feature that needs
 * to talk to Mercado Pago without ever creating a circular module graph.
 */
@Module({
  controllers: [],
  providers: [MercadoPagoConfig, MercadoPagoClient],
  exports: [MercadoPagoConfig, MercadoPagoClient],
})
export class MercadoPagoModule {}
