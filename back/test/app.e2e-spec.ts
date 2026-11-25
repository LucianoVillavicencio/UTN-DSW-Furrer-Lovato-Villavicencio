//tests de integration, son pruebas que se hacen para verificar que la aplicacion funciona correctamente
// Test End-to-End (E2E): prueba el flujo completo de la aplicación real de punta a punta,
// levantando el AppModule real conectado a la base de datos MySQL (sin usar mocks).

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  // Antes de cada test: compila el módulo raíz real (lee el .env y conecta TypeORM a MySQL)
  // e inicializa el servidor HTTP completo de NestJS.
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Ejecuta una petición HTTP GET real con Supertest contra el endpoint público de planes.
  // Recorre router -> PlanController -> PlanService -> MySQL y verifica que responda 200 OK.

  it('/api/v1/plan (GET)', () => {
    return request(app.getHttpServer()).get('/api/v1/plan').expect(200);
  });
  // Al terminar cada test: cierra el servidor HTTP y libera la conexión a la base de datos.
  afterEach(async () => {
    await app.close();
  });
});
