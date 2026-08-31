import {
  Body,
  Controller,
  HttpCode,
  Headers,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { WEBHOOK_THROTTLE } from '../../auth/auth.throttle';
import { MercadoPagoConfig } from './mercadopago.config';
import { verifyAndDispatchWebhook } from './webhook.controller';
import { WebhookService } from './webhook.service';
import type { WebhookNotificationDto } from './dto/webhook-notification-dto';

/**
 * A second front door for exactly the same notifications `WebhookController`
 * receives at `/api/v1/mercadopago/webhook`. Confirmed empirically (ngrok's
 * local request inspector, five real deliveries during Mercado Pago Point
 * integration testing) that this application's `order`/`point_integration_wh`
 * topic notifications ignore the path component of the registered callback
 * URL entirely and always POST to the bare origin — `save_webhook` echoes
 * back the full `.../api/v1/mercadopago/webhook` URL as "saved", but every
 * live delivery landed on `/`. Whether that is a Point-product-specific
 * quirk or general Mercado Pago behaviour wasn't worth chasing further; this
 * exists so notifications are received either way, in local dev (ngrok) and
 * in any future real deployment.
 *
 * Shares `verifyAndDispatchWebhook` with `WebhookController` rather than
 * duplicating the signature check — this is not a relaxed, second security
 * surface, just another route onto the identical lock.
 */
@Controller()
@ApiTags('Mercado Pago')
export class WebhookRootController {
  constructor(
    private readonly config: MercadoPagoConfig,
    private readonly webhookService: WebhookService,
  ) {}

  @Post()
  @HttpCode(200)
  @Throttle({
    webhook: { limit: WEBHOOK_THROTTLE.limit, ttl: WEBHOOK_THROTTLE.ttl },
  })
  @SkipThrottle({ auth: true, contact: true })
  async receiveRootWebhook(
    @Headers('x-signature') signatureHeader: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Query('data.id') dataId: string | undefined,
    @Query('type') type: string | undefined,
    @Body() _body: WebhookNotificationDto,
  ): Promise<{ received: true }> {
    return verifyAndDispatchWebhook(this.config, this.webhookService, {
      signatureHeader,
      requestId,
      dataId,
      type,
    });
  }
}
