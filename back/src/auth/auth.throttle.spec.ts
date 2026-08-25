import { Controller, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AUTH_THROTTLE } from './auth.throttle';

@Controller('login-probe')
class LoginProbeController {
  @Post()
  login() {
    return { ok: true };
  }
}

describe('authentication rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([AUTH_THROTTLE])],
      controllers: [LoginProbeController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses the sixth attempt from the same address inside the window', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer() as App)
        .post('/login-probe')
        .expect(201);
    }

    await request(app.getHttpServer() as App)
      .post('/login-probe')
      .expect(429);
  });
});
