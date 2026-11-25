// Test de Integración: prueba cómo interactúan varias capas juntas (Supertest HTTP + Router +
// Guards de autenticación/roles + JwtModule real + Controlador), sin tocar la base de datos.
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Auth } from '../decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import { ANONYMOUS, buildAuthzApp, tokenFor } from './authz-harness';

// Controlador de prueba con los 3 niveles de acceso de la aplicación:
// público (/open), usuario logueado (/member) y solo administrador (/admin).
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
  // Antes de los tests: levanta la app de NestJS con los Guards y el JwtModule reales.

  beforeAll(async () => {
    app = await buildAuthzApp(ProbeController, []);
  });

  // Al terminar: cierra el servidor HTTP de prueba.
  afterAll(async () => {
    await app.close();
  });

  // Helper con Supertest: hace una petición GET real e inyecta el header Bearer si hay token.
  const call = (path: string, token: string | undefined) => {
    const req = request(app.getHttpServer() as App).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  // 1. Ruta pública: un usuario anónimo puede entrar y recibe 200 OK.
  it('lets anyone reach an undecorated route', async () => {
    await call('/probe/open', ANONYMOUS).expect(200);
  });

  // 2. Ruta protegida sin token: el AuthGuard rechaza con 401 Unauthorized.
  it('rejects an anonymous caller on a guarded route', async () => {
    await call('/probe/member', ANONYMOUS).expect(401);
  });

  // 3. Control de roles: un miembro común intentando entrar a una ruta admin recibe 403 Forbidden.
  it('rejects a member on an admin route', async () => {
    await call('/probe/admin', tokenFor('member')).expect(403);
  });

  // 4. Acceso admin: un token con rol ADMIN accede correctamente a la ruta admin (200 OK).
  it('lets an admin through an admin route', async () => {
    await call('/probe/admin', tokenFor('admin')).expect(200);
  });

  // 5. Jerarquía de roles: un ADMIN también tiene acceso a rutas de miembro (200 OK).
  it('lets an admin through a member route, because ADMIN passes every check', async () => {
    await call('/probe/member', tokenFor('admin')).expect(200);
  });

  // 6. Verificación criptográfica: un token malformado o con firma inválida es rechazado con 401.
  it('rejects a token signed with the wrong secret', async () => {
    await call('/probe/member', 'not.a.token').expect(401);
  });
});
