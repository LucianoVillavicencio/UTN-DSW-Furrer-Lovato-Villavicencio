import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoClase } from './entity/turno-clase.entity';
import { TurnoClaseService } from './turno-clase.service';
import { TurnoClaseController } from './turno-clase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TurnoClase])],
  controllers: [TurnoClaseController],
  providers: [TurnoClaseService],
  exports: [TurnoClaseService],
})
export class TurnoClaseModule {}
