import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PauseController } from './pause.controller';
import { PauseService } from './pause.service';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

describe('PauseController', () => {
  let app: INestApplication;
  let pauseService: { pause: jest.Mock; unpause: jest.Mock };

  beforeAll(async () => {
    pauseService = {
      pause: jest.fn().mockResolvedValue({ id: 7 }),
      unpause: jest.fn().mockResolvedValue({ id: 7 }),
    };

    app = await buildAuthzApp(PauseController, [
      { provide: PauseService, useValue: pauseService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets an admin pause a subscription, passing the admin id from the JWT', async () => {
    await request(app.getHttpServer() as App)
      .patch('/api/v1/subscription/7/pause')
      .set('Authorization', `Bearer ${tokenFor('admin', 555)}`)
      .expect(200);

    expect(pauseService.pause).toHaveBeenCalledWith(7, 555);
  });

  it('lets an admin unpause a subscription', async () => {
    await request(app.getHttpServer() as App)
      .patch('/api/v1/subscription/7/unpause')
      .set('Authorization', `Bearer ${tokenFor('admin', 555)}`)
      .expect(200);

    expect(pauseService.unpause).toHaveBeenCalledWith(7);
  });

  it('refuses a member (non-admin) trying to pause a subscription', async () => {
    await request(app.getHttpServer() as App)
      .patch('/api/v1/subscription/7/pause')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(403);

    expect(pauseService.pause).not.toHaveBeenCalled();
  });

  it('refuses an unauthenticated request', async () => {
    await request(app.getHttpServer() as App)
      .patch('/api/v1/subscription/7/pause')
      .expect(401);

    expect(pauseService.pause).not.toHaveBeenCalled();
  });
});
