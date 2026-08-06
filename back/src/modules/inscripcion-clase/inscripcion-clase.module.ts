import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionClase } from './entity/inscripcion-clase.entity';
import { TurnoClase } from '../turno-clase/entity/turno-clase.entity';
import { InscripcionClaseService } from './inscripcion-clase.service';
import { InscripcionClaseController } from './inscripcion-clase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionClase, TurnoClase])],
  controllers: [InscripcionClaseController],
  providers: [InscripcionClaseService],
  exports: [InscripcionClaseService],
})
export class InscripcionClaseModule {}

