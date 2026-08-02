import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoClase } from './entity/tipo-clase.entity';
import { TipoClaseService } from './tipo-clase.service';
import { TipoClaseController } from './tipo-clase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoClase])],
  controllers: [TipoClaseController],
  providers: [TipoClaseService],
  exports: [TipoClaseService],
})
export class TipoClaseModule {}
