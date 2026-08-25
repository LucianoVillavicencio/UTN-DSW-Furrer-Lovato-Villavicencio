import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
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

  const config = new DocumentBuilder()
    .setTitle('Gimnasio')
    .setDescription('Trabajo Practico Desarrollo de Software')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Restricted to the frontend origin: enableCors() with no options accepts
  // any origin, which we do not want as soon as the admin panel is reachable
  // outside localhost.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
