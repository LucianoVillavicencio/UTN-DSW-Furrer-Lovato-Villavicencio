import {
  CanActivate,
  Controller,
  Get,
  INestApplication,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { SecurityLogFilter } from './security-log.filter';

// Mimics AuthGuard: throws UnauthorizedException directly from canActivate.
class ThrowsUnauthorizedGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

// Mimics RolesGuard: denies by returning false. Nest's own GuardsConsumer is
// what turns a falsy return into a thrown ForbiddenException, so this is the
// same path a role mismatch takes in the real app, not a hand-thrown one.
class DeniesGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

@Controller('secure')
class SecureTestController {
  @UseGuards(ThrowsUnauthorizedGuard)
  @Get('unauthorized')
  unauthorized() {
    return { ok: true };
  }

  @UseGuards(DeniesGuard)
  @Get('forbidden')
  forbidden() {
    return { ok: true };
  }
}

/**
 * A prior version of this fix put the logging in an interceptor's
 * catchError. That never fired for a Guard-thrown 401/403, because Guards
 * run to completion before interceptors start — an exception thrown (or
 * synthesized) by a Guard never reaches an interceptor at all. This test
 * exercises that exact path — a real Guard denying a real route through a
 * real Nest HTTP pipeline, with SecurityLogFilter wired in the same way
 * app.module.ts wires it (APP_FILTER) — so it would have failed against
 * that version and catches a regression back to it.
 */
describe('SecurityLogFilter (e2e)', () => {
  let app: INestApplication<App>;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    logSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const moduleFixture = await Test.createTestingModule({
      controllers: [SecureTestController],
      providers: [{ provide: APP_FILTER, useClass: SecurityLogFilter }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await app.close();
  });

  it('logs and returns 401 when a Guard throws UnauthorizedException', async () => {
    await request(app.getHttpServer()).get('/secure/unauthorized').expect(401);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('401 GET /secure/unauthorized'),
    );
  });

  it('logs and returns 403 when a Guard denies (RolesGuard-style)', async () => {
    await request(app.getHttpServer()).get('/secure/forbidden').expect(403);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('403 GET /secure/forbidden'),
    );
  });
});
