import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ChargeOrderController } from './chargeOrder.controller';
import { ChargeOrderService } from './chargeOrder.service';
import { MercadoPagoClient } from '../mercadopago/mercadopago.client';
import { MercadoPagoConfig } from '../mercadopago/mercadopago.config';
import { PaymentService } from '../payment/payment.service';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';
import { ORDER_EXPIRATION } from './chargeOrder.rules';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

describe('ChargeOrderController', () => {
  let app: INestApplication;
  let chargeOrderService: {
    createCharge: jest.Mock;
    findById: jest.Mock;
    setMpOrderId: jest.Mock;
    closeAsError: jest.Mock;
    cancel: jest.Mock;
  };
  let mercadoPagoClient: {
    createOrder: jest.Mock;
    cancelOrder: jest.Mock;
  };
  let paymentService: { findPayment: jest.Mock };
  // Mutable stand-in for MercadoPagoConfig's getters — the controller reads
  // the real terminal/caja ids from here, never from the request body.
  let mercadoPagoConfig: {
    pointTerminalId: string | undefined;
    qrExternalPosId: string | undefined;
  };

  // What the SERVER is configured with, deliberately different from the
  // 'terminal-1'/'caja-5' the request body below claims — that difference is
  // what proves the body is ignored.
  const CONFIGURED_TERMINAL = 'server-terminal-9';
  const CONFIGURED_POS = 'server-caja-9';

  const pendingOrder = {
    id: 1,
    subscriptionId: 7,
    planDurationId: 55,
    method: 'point' as const,
    externalReference: 'flg-sub-7-abcd1234',
    mpOrderId: null,
    qrPayload: null,
    collectionPointId: 'terminal-1',
    amount: 15000,
    status: ChargeOrderStatus.PENDING,
    expiresAt: new Date('2026-08-29T12:05:00Z'),
    paymentId: null,
    createdById: 40000001,
    updatedAt: new Date('2026-08-29T12:00:00Z'),
  };

  beforeAll(async () => {
    chargeOrderService = {
      createCharge: jest.fn(),
      findById: jest.fn(),
      setMpOrderId: jest.fn(),
      closeAsError: jest.fn(),
      cancel: jest.fn(),
    };
    mercadoPagoClient = {
      createOrder: jest.fn(),
      cancelOrder: jest.fn(),
    };
    paymentService = { findPayment: jest.fn() };
    mercadoPagoConfig = {
      pointTerminalId: CONFIGURED_TERMINAL,
      qrExternalPosId: CONFIGURED_POS,
    };

    app = await buildAuthzApp(ChargeOrderController, [
      { provide: ChargeOrderService, useValue: chargeOrderService },
      { provide: MercadoPagoClient, useValue: mercadoPagoClient },
      {
        // Plain values, not jest.Mocks: the controller reads these as
        // properties (MercadoPagoConfig exposes them as getters), so the
        // harness's Record<string, jest.Mock> shape has to be widened here.
        provide: MercadoPagoConfig,
        useValue: mercadoPagoConfig as unknown as Record<string, jest.Mock>,
      },
      { provide: PaymentService, useValue: paymentService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restored per test, since the "not configured" cases below blank them.
    mercadoPagoConfig.pointTerminalId = CONFIGURED_TERMINAL;
    mercadoPagoConfig.qrExternalPosId = CONFIGURED_POS;
  });

  describe('POST /api/v1/charge-order', () => {
    it('arms a point order and dispatches it to Mercado Pago', async () => {
      chargeOrderService.createCharge.mockResolvedValue(pendingOrder);
      mercadoPagoClient.createOrder.mockResolvedValue({
        id: 'mp-order-1',
        status: 'created',
      });
      chargeOrderService.setMpOrderId.mockResolvedValue({
        ...pendingOrder,
        mpOrderId: 'mp-order-1',
      });

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('admin', 40000001)}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'point',
          collectionPointId: 'terminal-1',
        })
        .expect(201);

      // The body said 'terminal-1'; the server's own config says
      // 'server-terminal-9', and that is what must reach both the busy-point
      // check and Mercado Pago.
      expect(chargeOrderService.createCharge).toHaveBeenCalledWith({
        subscriptionId: 7,
        months: 3,
        method: 'point',
        collectionPointId: CONFIGURED_TERMINAL,
        adminId: 40000001,
      });
      expect(mercadoPagoClient.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'point',
          externalReference: 'flg-sub-7-abcd1234',
          totalAmount: 15000,
          expirationTime: ORDER_EXPIRATION,
          point: { terminal_id: CONFIGURED_TERMINAL },
        }),
      );
      // A 'point' order has no QR payload — persisted as null, same as it
      // was never set.
      expect(chargeOrderService.setMpOrderId).toHaveBeenCalledWith(
        1,
        'mp-order-1',
        null,
      );
      expect(response.body).toMatchObject({
        id: 1,
        status: ChargeOrderStatus.PENDING,
        method: 'point',
        amount: 15000,
        qrPayload: null,
      });
    });

    it('arms a qr order with the hybrid mode config', async () => {
      chargeOrderService.createCharge.mockResolvedValue({
        ...pendingOrder,
        method: 'qr',
        collectionPointId: 'caja-5',
      });
      mercadoPagoClient.createOrder.mockResolvedValue({
        id: 'mp-order-2',
        qrData: 'qr-payload-data',
      });

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'qr',
          collectionPointId: 'caja-5',
        })
        .expect(201);

      // Same rule on the qr side: the body's 'caja-5' is ignored in favour of
      // the server-configured external_pos_id.
      expect(chargeOrderService.createCharge).toHaveBeenCalledWith(
        expect.objectContaining({ collectionPointId: CONFIGURED_POS }),
      );
      expect(mercadoPagoClient.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'qr',
          qr: { external_pos_id: CONFIGURED_POS, mode: 'hibrid' },
        }),
      );
      // The QR payload must be PERSISTED (not just returned once in this
      // response) so a panel reload or a later GET /:id can still recover
      // it for the rest of the order's live window.
      expect(chargeOrderService.setMpOrderId).toHaveBeenCalledWith(
        1,
        'mp-order-2',
        'qr-payload-data',
      );
      expect(response.body).toMatchObject({ qrPayload: 'qr-payload-data' });
    });

    it('closes the order as error and responds 502 when Mercado Pago rejects it', async () => {
      chargeOrderService.createCharge.mockResolvedValue(pendingOrder);
      mercadoPagoClient.createOrder.mockRejectedValue(
        new Error('Mercado Pago request failed (createOrder): network error'),
      );

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'point',
          collectionPointId: 'terminal-1',
        })
        .expect(502);

      expect(chargeOrderService.closeAsError).toHaveBeenCalledWith(
        'flg-sub-7-abcd1234',
        expect.any(String),
      );
      expect(chargeOrderService.setMpOrderId).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        statusCode: 502,
      });
    });

    it('refuses a point charge with 409 when the server has no terminal configured', async () => {
      // Without a real terminal id there is nothing to key the busy-point
      // check on — arming the order anyway would silently defeat the one
      // safety property the shared-terminal design rests on.
      mercadoPagoConfig.pointTerminalId = undefined;

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'point',
          // A body that supplies one anyway must NOT be able to stand in for
          // the missing server config.
          collectionPointId: 'terminal-from-the-browser',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        message: 'La terminal Point no está configurada en el servidor.',
      });
      expect(chargeOrderService.createCharge).not.toHaveBeenCalled();
      expect(mercadoPagoClient.createOrder).not.toHaveBeenCalled();
    });

    it('refuses a qr charge with 409 when the server has no caja configured', async () => {
      mercadoPagoConfig.qrExternalPosId = undefined;

      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'qr',
          collectionPointId: 'caja-from-the-browser',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        message: 'La caja QR no está configurada en el servidor.',
      });
      expect(chargeOrderService.createCharge).not.toHaveBeenCalled();
      expect(mercadoPagoClient.createOrder).not.toHaveBeenCalled();
    });

    it('refuses a non-admin caller', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/charge-order')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .send({
          subscriptionId: 7,
          months: 3,
          method: 'point',
          collectionPointId: 'terminal-1',
        })
        .expect(403);

      expect(chargeOrderService.createCharge).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/charge-order/:id', () => {
    it('reports newEndDate as null while the order is still pendiente', async () => {
      chargeOrderService.findById.mockResolvedValue(pendingOrder);

      const response = await request(app.getHttpServer() as App)
        .get('/api/v1/charge-order/1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(response.body).toEqual({
        status: ChargeOrderStatus.PENDING,
        method: 'point',
        amount: 15000,
        // A 'point' order never has a QR payload.
        qrPayload: null,
        newEndDate: null,
        expiresAt: pendingOrder.expiresAt.toISOString(),
        updatedAt: pendingOrder.updatedAt.toISOString(),
      });
      expect(paymentService.findPayment).not.toHaveBeenCalled();
    });

    it('returns the persisted qrPayload for a still-pendiente qr order', async () => {
      // Simulates a panel reload/re-poll mid-window: the payload must come
      // back from the persisted row, not just from the original POST
      // response.
      chargeOrderService.findById.mockResolvedValue({
        ...pendingOrder,
        method: 'qr',
        qrPayload: 'qr-payload-data',
      });

      const response = await request(app.getHttpServer() as App)
        .get('/api/v1/charge-order/1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(response.body).toMatchObject({
        method: 'qr',
        qrPayload: 'qr-payload-data',
      });
    });

    it('reports newEndDate from the resulting subscription once paid', async () => {
      chargeOrderService.findById.mockResolvedValue({
        ...pendingOrder,
        status: ChargeOrderStatus.PAID,
        paymentId: 42,
      });
      paymentService.findPayment.mockResolvedValue({
        id: 42,
        subscription: { id: 7, endDate: '2026-09-29' },
      });

      const response = await request(app.getHttpServer() as App)
        .get('/api/v1/charge-order/1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(paymentService.findPayment).toHaveBeenCalledWith(42);
      expect(response.body).toMatchObject({
        status: ChargeOrderStatus.PAID,
        newEndDate: '2026-09-29',
      });
    });
  });

  describe('PATCH /api/v1/charge-order/:id/cancel', () => {
    it('cancels on Mercado Pago and locally when an mpOrderId exists', async () => {
      chargeOrderService.findById.mockResolvedValue({
        ...pendingOrder,
        mpOrderId: 'mp-order-1',
      });
      mercadoPagoClient.cancelOrder.mockResolvedValue({
        id: 'mp-order-1',
        status: 'cancelled',
      });
      chargeOrderService.cancel.mockResolvedValue({
        ...pendingOrder,
        status: ChargeOrderStatus.CANCELLED,
      });

      await request(app.getHttpServer() as App)
        .patch('/api/v1/charge-order/1/cancel')
        .set('Authorization', `Bearer ${tokenFor('admin', 40000001)}`)
        .expect(200);

      expect(mercadoPagoClient.cancelOrder).toHaveBeenCalledWith('mp-order-1');
      expect(chargeOrderService.cancel).toHaveBeenCalledWith(1, 40000001);
    });

    it('skips the Mercado Pago call when the order never reached MP', async () => {
      chargeOrderService.findById.mockResolvedValue({
        ...pendingOrder,
        mpOrderId: null,
      });
      chargeOrderService.cancel.mockResolvedValue({
        ...pendingOrder,
        status: ChargeOrderStatus.CANCELLED,
      });

      await request(app.getHttpServer() as App)
        .patch('/api/v1/charge-order/1/cancel')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(mercadoPagoClient.cancelOrder).not.toHaveBeenCalled();
      expect(chargeOrderService.cancel).toHaveBeenCalled();
    });

    it('still cancels locally when the Mercado Pago call fails', async () => {
      chargeOrderService.findById.mockResolvedValue({
        ...pendingOrder,
        mpOrderId: 'mp-order-1',
      });
      mercadoPagoClient.cancelOrder.mockRejectedValue(
        new Error('Mercado Pago request failed (cancelOrder): timeout'),
      );
      chargeOrderService.cancel.mockResolvedValue({
        ...pendingOrder,
        status: ChargeOrderStatus.CANCELLED,
      });

      await request(app.getHttpServer() as App)
        .patch('/api/v1/charge-order/1/cancel')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(chargeOrderService.cancel).toHaveBeenCalled();
    });
  });
});
