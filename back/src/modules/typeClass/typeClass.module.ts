import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeClass } from './entity/typeClass.entity';
import { TypeClassController } from './typeClass.controller';
import { TypeClassService } from './typeClass.service';

@Module({
  imports: [TypeOrmModule.forFeature([TypeClass])],
  controllers: [TypeClassController],
  providers: [TypeClassService],
  exports: [TypeClassService],
})
export class TypeClassModule {}
