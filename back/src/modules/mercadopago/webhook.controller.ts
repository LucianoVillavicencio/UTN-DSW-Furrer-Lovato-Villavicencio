import {
  Body,
  Controller,
  HttpCode,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { WEBHOOK_THROTTLE } from '../../auth/auth.throttle';
import { MercadoPagoConfig } from './mercadopago.config';
import { verifyWebhookSignature } from './mercadopago.rules';
import { WebhookService } from './webhook.service';
import type { WebhookNotificationDto } from './dto/webhook-notification-dto';

/**
 * Receives Mercado Pago's payment notifications. This is the ONLY public,
 * unauthenticated endpoint in the whole application — Mercado Pago has no
 * user session and cannot present our JWT, so there is nothing an `@Auth()`
 * could check here. The signature check below (`verifyWebhookSignature`,
 * HMAC-SHA256 over `id`/`request-id`/`ts` with our webhook secret) is the
 * entire authentication story for this route, which is why it happens first,
 * unconditionally, and rejects with `UnauthorizedException` on any failure —
 * a missing header, a tampered value, a signature made with the wrong
 * secret, or a replay outside the five-minute tolerance window. The existing
 * global `SecurityLogFilter` (`@Catch(UnauthorizedException, ...)`) already
 * logs every one of those rejections; nothing more is needed here for that.
 *
 * `WEBHOOK_THROTTLE` (100/min) is this route's only other defense, since it
 * carries no `@Auth()` at all — see auth.throttle.ts.
 */
/**
 * Verifies a notification's signature and, if valid, dispatches it to
 * `WebhookService`. Shared by every controller that can receive a Mercado
 * Pago notification — see `WebhookRootController` for why more than one
 * exists — so the signature check (the entire authentication story for
 * this traffic) lives in exactly one place regardless of how many routes
 * front it.
 */
export async function verifyAndDispatchWebhook(
  config: MercadoPagoConfig,
  webhookService: WebhookService,
  input: {
    signatureHeader: string | undefined;
    requestId: string | undefined;
    dataId: string | undefined;
    type: string | undefined;
  },
): Promise<{ received: true }> {
  const secret = config.webhookSecret;
  const verified =
    !!secret &&
    verifyWebhookSignature(
      {
        signatureHeader: input.signatureHeader ?? '',
        requestId: input.requestId ?? '',
        dataId: input.dataId ?? '',
      },
      secret,
      new Date(),
    );

  if (!verified) {
    throw new UnauthorizedException(
      'Firma de webhook de Mercado Pago inválida.',
    );
  }

  // dataId is guaranteed non-empty here: an empty dataId could only have
  // produced a verified signature if the secret itself were compromised,
  // in which case the whole scheme is already broken — this is not a
  // realistic branch to defend against separately.
  await webhookService.handleNotification(input.dataId as string, input.type);

  return { received: true };
}

@Controller('api/v1/mercadopago')
@ApiTags('Mercado Pago')
export class WebhookController {
  constructor(
    private readonly config: MercadoPagoConfig,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @Throttle({
    webhook: { limit: WEBHOOK_THROTTLE.limit, ttl: WEBHOOK_THROTTLE.ttl },
  })
  // Not an auth or contact route — see auth.throttle.ts for why a bare
  // @SkipThrottle() would not do this.
  @SkipThrottle({ auth: true, contact: true })
  async receiveWebhook(
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
