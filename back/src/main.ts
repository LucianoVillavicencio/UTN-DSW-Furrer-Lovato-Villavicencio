import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { applySecurityHeaders } from './main.security';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  applySecurityHeaders(app);

  // Uploaded trainer photos live outside the versioned API: the column stores
  // /uploads/trainers/<file> and the browser fetches it straight from the root.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Anything not declared in the DTO is dropped, and a request that
      // carries extra properties is rejected with a 400 instead of silently
      // ignoring them.
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // The document lists every route, including the admin ones. Useful while
  // developing, a map of the attack surface once the API is reachable
  // publicly, so it is served in development only — opt-in by name, the same
  // rule and the same validated read as `synchronize` in typeorm.config.ts.
  // A deployment with no NODE_ENV has already failed to boot by this point,
  // because the TypeORM config is built during AppModule initialisation.
  // See FLG-SEC-10 and FLG-SEC-11 in the security audit.
  const configService = app.get(ConfigService);

  if (configService.getOrThrow<string>('NODE_ENV') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Gimnasio')
      .setDescription('Trabajo Practico Desarrollo de Software')
      .setVersion('1.0')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  // Restricted to the frontend origin: enableCors() with no options accepts
  // any origin, which we do not want as soon as the admin panel is reachable
  // outside localhost.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
