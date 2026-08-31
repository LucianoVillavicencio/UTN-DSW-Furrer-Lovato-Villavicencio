import { createHmac } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MercadoPagoConfig } from './mercadopago.config';
import { buildAuthzApp } from '../../auth/testing/authz-harness';

const SECRET = 'a-test-webhook-secret';

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

describe('POST /api/v1/mercadopago/webhook', () => {
  let app: INestApplication;
  let webhookService: { handleNotification: jest.Mock };

  beforeAll(async () => {
    webhookService = {
      handleNotification: jest.fn().mockResolvedValue(undefined),
    };
    app = await buildAuthzApp(WebhookController, [
      {
        provide: MercadoPagoConfig,
        useValue: { webhookSecret: SECRET },
      },
      { provide: WebhookService, useValue: webhookService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a request with no signature header with 401', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/v1/mercadopago/webhook')
      .query({ 'data.id': '123456', type: 'payment' })
      .set('x-request-id', 'req-1')
      .send({})
      .expect(401);

    expect(webhookService.handleNotification).not.toHaveBeenCalled();
  });

  it('rejects a tampered signature with 401 and writes nothing', async () => {
    const ts = String(Date.now());
    // Signed for a DIFFERENT data.id than the one actually sent — the same
    // shape an attacker swapping in another payment's id would produce.
    const tamperedHeader = sign('999999', 'req-1', ts);

    await request(app.getHttpServer() as App)
      .post('/api/v1/mercadopago/webhook')
      .query({ 'data.id': '123456', type: 'payment' })
      .set('x-request-id', 'req-1')
      .set('x-signature', tamperedHeader)
      .send({})
      .expect(401);

    expect(webhookService.handleNotification).not.toHaveBeenCalled();
  });

  it('accepts a correctly signed notification and returns 200', async () => {
    const ts = String(Date.now());
    const header = sign('123456', 'req-1', ts);

    const response = await request(app.getHttpServer() as App)
      .post('/api/v1/mercadopago/webhook')
      .query({ 'data.id': '123456', type: 'payment' })
      .set('x-request-id', 'req-1')
      .set('x-signature', header)
      .send({})
      .expect(200);

    expect(response.body).toEqual({ received: true });
    expect(webhookService.handleNotification).toHaveBeenCalledWith(
      '123456',
      'payment',
    );
  });

  it('rejects with 401 when the webhook secret is not configured', async () => {
    const unconfiguredApp = await buildAuthzApp(WebhookController, [
      { provide: MercadoPagoConfig, useValue: { webhookSecret: undefined } },
      { provide: WebhookService, useValue: webhookService },
    ]);

    const ts = String(Date.now());
    const header = sign('123456', 'req-1', ts);

    await request(unconfiguredApp.getHttpServer() as App)
      .post('/api/v1/mercadopago/webhook')
      .query({ 'data.id': '123456', type: 'payment' })
      .set('x-request-id', 'req-1')
      .set('x-signature', header)
      .send({})
      .expect(401);

    expect(webhookService.handleNotification).not.toHaveBeenCalled();
    await unconfiguredApp.close();
  });
});
