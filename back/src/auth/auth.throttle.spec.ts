import { Controller, Get, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  SkipThrottle,
  Throttle,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  AUTH_THROTTLE,
  CONTACT_THROTTLE,
  SKIP_ALL_THROTTLERS,
  SKIP_AUTH_THROTTLE,
  SKIP_CONTACT_THROTTLE,
} from './auth.throttle';

// Mirrors AuthController's two capped routes: AUTH_THROTTLE applies, and
// CONTACT_THROTTLE is skipped so its three-an-hour default cannot become the
// binding limit.
@Controller('login-probe')
@Throttle({ auth: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } })
@SkipThrottle(SKIP_CONTACT_THROTTLE)
class LoginProbeController {
  @Post()
  login() {
    return { ok: true };
  }
}

// Mirrors ContactController.createContact.
@Controller('contact-probe')
@Throttle({
  contact: { limit: CONTACT_THROTTLE.limit, ttl: CONTACT_THROTTLE.ttl },
})
@SkipThrottle(SKIP_AUTH_THROTTLE)
class ContactProbeController {
  @Post()
  createContact() {
    return { ok: true };
  }
}

// Mirrors an ordinary catalogue controller: a class-level skip and a handler
// that carries no throttling decorator of its own.
@Controller('catalogue-probe')
@SkipThrottle(SKIP_ALL_THROTTLERS)
class CatalogueProbeController {
  @Get()
  list() {
    return [];
  }
}

describe('rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      // Both named throttlers, exactly as AppModule registers them: a single
      // one would not reproduce the defaults leaking across routes.
      imports: [ThrottlerModule.forRoot([AUTH_THROTTLE, CONTACT_THROTTLE])],
      controllers: [
        LoginProbeController,
        ContactProbeController,
        CatalogueProbeController,
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses the sixth login attempt from the same address inside the window', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer() as App)
        .post('/login-probe')
        .expect(201);
    }

    await request(app.getHttpServer() as App)
      .post('/login-probe')
      .expect(429);
  });

  it('refuses the fourth contact form submission inside the hour', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app.getHttpServer() as App)
        .post('/contact-probe')
        .expect(201);
    }

    await request(app.getHttpServer() as App)
      .post('/contact-probe')
      .expect(429);
  });

  // ThrottlerGuard runs EVERY named throttler on EVERY request, and a route
  // with no override of its own falls back to that throttler's module-level
  // default. Without the class-level skip, CONTACT_THROTTLE's default caps an
  // ordinary route at three requests an hour — this is the regression.
  it('does not rate limit a route that skips both throttlers', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer() as App)
        .get('/catalogue-probe')
        .expect(200);
    }
  });
});
