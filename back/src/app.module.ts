import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typerom.config';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { TipoClaseModule } from './modules/tipo-clase/tipo-clase.module';
import { PlanModule } from './modules/plan/plan.module';
import { ProfesorModule } from './modules/profesor/profesor.module';
import { ClaseModule } from './modules/clase/clase.module';
import { TurnoClaseModule } from './modules/turno-clase/turno-clase.module';
import { SuscripcionModule } from './modules/suscripcion/suscripcion.module';
import { PagoModule } from './modules/pago/pago.module';
import { InscripcionClaseModule } from './modules/inscripcion-clase/inscripcion-clase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UserModule,
    TipoClaseModule,
    PlanModule,
    ProfesorModule,
    ClaseModule,
    TurnoClaseModule,
    SuscripcionModule,
    PagoModule,
    InscripcionClaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
