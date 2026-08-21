

// transform: true : Convierte el JSON crudo del body en una instancia real de la clase DTO
// whitelist: true : Elimina cualquier propiedad del body que no este declarada en el DTO.
// ForbidnonWhiteListed : true => Rechaza el request entero con un 400 si vino con que no debia.


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,  
      whitelist: true, // Elimina cualquier propiedad no declarada en el DTO
      forbidNonWhitelisted: true, // Rechaza la request si vienen propiedades extra
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gimnasio')
    .setDescription('Trabajo Practico Desarrollo de Software')
    .setVersion('1.0')
    .build();


  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Restringido al origen del frontend: enableCors() sin opciones acepta
  // cualquier origin, lo cual no queremos apenas el panel admin sea alcanzable
  // fuera de localhost.
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
