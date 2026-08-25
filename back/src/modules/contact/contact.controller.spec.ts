import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

describe('ContactController authorization', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildAuthzApp(ContactController, [
      {
        provide: ContactService,
        useValue: {
          create: jest.fn().mockResolvedValue({}),
          findAll: jest.fn().mockResolvedValue([]),
          findOne: jest.fn().mockResolvedValue({}),
        },
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('still lets anyone submit the contact form', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/v1/contact')
      .send({ name: 'Rosa', email: 'rosa@gmail.com', message: 'Hola' })
      .expect(201);
  });

  it('refuses to list submissions for an anonymous caller', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/contact')
      .expect(401);
  });

  it('refuses to list submissions for a plain member', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/contact')
      .set('Authorization', `Bearer ${tokenFor('member')}`)
      .expect(403);
  });

  it('lets an admin list submissions', async () => {
    await request(app.getHttpServer() as App)
      .get('/api/v1/contact')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .expect(200);
  });
});
