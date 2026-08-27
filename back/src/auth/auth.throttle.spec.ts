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
  REGISTERED_THROTTLERS,
  SKIP_ALL_THROTTLERS,
  SKIP_AUTH_THROTTLE,
  SKIP_CONTACT_THROTTLE,
  WEBHOOK_THROTTLE,
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

// Mirrors WebhookController: no @Auth() and no SKIP_ALL_THROTTLERS — it is
// the one route WEBHOOK_THROTTLE is meant to actually bind on.
@Controller('webhook-probe')
@Throttle({
  webhook: { limit: WEBHOOK_THROTTLE.limit, ttl: WEBHOOK_THROTTLE.ttl },
})
@SkipThrottle({ auth: true, contact: true })
class WebhookProbeController {
  @Post()
  receive() {
    return { ok: true };
  }
}

describe('rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      // Every named throttler, exactly as AppModule registers them (from the
      // same REGISTERED_THROTTLERS array): a subset would not reproduce the
      // defaults leaking across routes.
      imports: [ThrottlerModule.forRoot(REGISTERED_THROTTLERS)],
      controllers: [
        LoginProbeController,
        ContactProbeController,
        CatalogueProbeController,
        WebhookProbeController,
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

  // WebhookController: the one route WEBHOOK_THROTTLE is meant to actually
  // bind on, since it carries no @Auth() at all.
  it('refuses the 101st webhook delivery from the same address inside the minute', async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await request(app.getHttpServer() as App)
        .post('/webhook-probe')
        .expect(201);
    }

    await request(app.getHttpServer() as App)
      .post('/webhook-probe')
      .expect(429);
  }, 30_000);
});

// The trap this task exists to prevent: SKIP_ALL_THROTTLERS is a literal
// object naming each throttler explicitly (a bare @SkipThrottle() only skips
// one literally named 'default'). Registering a new throttler in
// REGISTERED_THROTTLERS without adding it here means every controller that
// relies on SKIP_ALL_THROTTLERS silently stops skipping it, and the whole
// authenticated API quietly gains that throttler's cap. This test reads
// REGISTERED_THROTTLERS itself, not a hardcoded list, so the next person who
// adds a fourth throttler there and forgets to update SKIP_ALL_THROTTLERS
// gets a failing test instead of that silent regression.
describe('SKIP_ALL_THROTTLERS', () => {
  it('names every registered throttler', () => {
    for (const throttler of REGISTERED_THROTTLERS) {
      const name = throttler.name as keyof typeof SKIP_ALL_THROTTLERS;
      expect(SKIP_ALL_THROTTLERS[name]).toBe(true);
    }
  });
});
