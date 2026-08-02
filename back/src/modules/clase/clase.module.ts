import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clase } from './entity/clase.entity';
import { ClaseService } from './clase.service';
import { ClaseController } from './clase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Clase])],
  controllers: [ClaseController],
  providers: [ClaseService],
  exports: [ClaseService],
})
export class ClaseModule {}
