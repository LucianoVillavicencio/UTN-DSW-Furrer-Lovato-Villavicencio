import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

describe('RefundController', () => {
  let app: INestApplication;
  let refundService: { quote: jest.Mock; issue: jest.Mock };

  beforeAll(async () => {
    refundService = {
      quote: jest.fn().mockResolvedValue({ refundAmount: 70000 }),
      issue: jest.fn().mockResolvedValue({ id: 55 }),
    };

    app = await buildAuthzApp(RefundController, [
      { provide: RefundService, useValue: refundService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets an admin fetch a refund quote', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/refund/quote/7')
      .set('Authorization', `Bearer ${tokenFor('admin', 555)}`)
      .expect(200);

    expect(refundService.quote).toHaveBeenCalledWith(7);
  });

  it('lets an admin issue a refund, passing the admin id from the JWT', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/v1/refund/7')
      .set('Authorization', `Bearer ${tokenFor('admin', 555)}`)
      .expect(201);

    expect(refundService.issue).toHaveBeenCalledWith(7, 555);
  });

  it('refuses a member (non-admin) trying to fetch a quote', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/refund/quote/7')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(403);

    expect(refundService.quote).not.toHaveBeenCalled();
  });

  it('refuses a member (non-admin) trying to issue a refund', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/v1/refund/7')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(403);

    expect(refundService.issue).not.toHaveBeenCalled();
  });

  it('refuses an unauthenticated quote request', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/refund/quote/7')
      .expect(401);

    expect(refundService.quote).not.toHaveBeenCalled();
  });

  it('refuses an unauthenticated issue request', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/v1/refund/7')
      .expect(401);

    expect(refundService.issue).not.toHaveBeenCalled();
  });
});
