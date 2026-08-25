import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { applySecurityHeaders } from './main.security';

@Controller('headers-probe')
class HeadersProbeController {
  @Get()
  get() {
    return { ok: true };
  }
}

describe('security headers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HeadersProbeController],
    }).compile();

    app = moduleRef.createNestApplication();
    applySecurityHeaders(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses content-type sniffing', async () => {
    const response = await request(app.getHttpServer() as App).get(
      '/headers-probe',
    );
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('refuses to be framed', async () => {
    const response = await request(app.getHttpServer() as App).get(
      '/headers-probe',
    );
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('hides the server technology', async () => {
    const response = await request(app.getHttpServer() as App).get(
      '/headers-probe',
    );
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
