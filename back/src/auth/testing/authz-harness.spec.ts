import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Auth } from '../decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import { ANONYMOUS, buildAuthzApp, tokenFor } from './authz-harness';

@Controller('probe')
class ProbeController {
  @Get('open')
  open() {
    return { ok: true };
  }

  @Get('member')
  @Auth()
  member() {
    return { ok: true };
  }

  @Get('admin')
  @Auth(Role.ADMIN)
  admin() {
    return { ok: true };
  }
}

describe('authz harness', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildAuthzApp(ProbeController, []);
  });

  afterAll(async () => {
    await app.close();
  });

  const call = (path: string, token: string | undefined) => {
    const req = request(app.getHttpServer() as App).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  it('lets anyone reach an undecorated route', async () => {
    await call('/probe/open', ANONYMOUS).expect(200);
  });

  it('rejects an anonymous caller on a guarded route', async () => {
    await call('/probe/member', ANONYMOUS).expect(401);
  });

  it('rejects a member on an admin route', async () => {
    await call('/probe/admin', tokenFor('member')).expect(403);
  });

  it('lets an admin through an admin route', async () => {
    await call('/probe/admin', tokenFor('admin')).expect(200);
  });

  it('lets an admin through a member route, because ADMIN passes every check', async () => {
    await call('/probe/member', tokenFor('admin')).expect(200);
  });

  it('rejects a token signed with the wrong secret', async () => {
    await call('/probe/member', 'not.a.token').expect(401);
  });
});
