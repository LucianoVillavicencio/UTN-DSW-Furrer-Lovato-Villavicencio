import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
