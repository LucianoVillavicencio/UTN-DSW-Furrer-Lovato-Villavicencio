import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SavedCardController } from './savedCard.controller';
import { SavedCardService } from './savedCard.service';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

// A full persisted row, exactly what SavedCardService methods actually
// return — mpCustomerId/mpCardId included. The controller is what must strip
// them before either the POST or GET response leaves the server.
const fullCard = {
  id: 1,
  userId: 40000001,
  mpCustomerId: 'customer-secret-id',
  mpCardId: 'card-secret-id',
  lastFourDigits: '4242',
  paymentMethodId: 'visa',
  expirationMonth: 12,
  expirationYear: 2030,
  active: true,
  deleted: false,
};

describe('SavedCardController response shape', () => {
  let app: INestApplication;
  let savedCardService: {
    findActiveForUser: jest.Mock;
    saveForUser: jest.Mock;
    removeForUser: jest.Mock;
  };

  beforeAll(async () => {
    savedCardService = {
      findActiveForUser: jest.fn(),
      saveForUser: jest.fn(),
      removeForUser: jest.fn(),
    };
    app = await buildAuthzApp(SavedCardController, [
      { provide: SavedCardService, useValue: savedCardService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('never returns mpCardId or mpCustomerId from POST /saved-card', async () => {
    savedCardService.saveForUser.mockResolvedValue(fullCard);

    const response = await request(app.getHttpServer() as App)
      .post('/api/v1/saved-card')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .send({ cardToken: 'tok-1' })
      .expect(201);

    expect(response.body).toEqual({
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
    });
    expect(response.body).not.toHaveProperty('mpCardId');
    expect(response.body).not.toHaveProperty('mpCustomerId');
    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('userId');
  });

  it('never returns mpCardId or mpCustomerId from GET /saved-card', async () => {
    savedCardService.findActiveForUser.mockResolvedValue(fullCard);

    const response = await request(app.getHttpServer() as App)
      .get('/api/v1/saved-card')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(200);

    expect(response.body).toEqual({
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
    });
    expect(response.body).not.toHaveProperty('mpCardId');
    expect(response.body).not.toHaveProperty('mpCustomerId');
  });

  it('returns null, not an error, when the member has no active card', async () => {
    savedCardService.findActiveForUser.mockResolvedValue(null);

    const response = await request(app.getHttpServer() as App)
      .get('/api/v1/saved-card')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(200);

    // Nest sends an empty body for a handler that returns null (same as
    // undefined) rather than the literal text "null" — asserted via
    // response.text since superagent normalizes a body-less response's
    // .body to {}, which would hide a change in this behavior.
    expect(response.text).toBe('');
  });
});
