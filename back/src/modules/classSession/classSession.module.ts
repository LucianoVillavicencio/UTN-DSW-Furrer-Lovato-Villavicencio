import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSession } from './entity/classSession.entity';
import { ClassSessionController } from './classSession.controller';
import { ClassSessionService } from './classSession.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClassSession])],
  controllers: [ClassSessionController],
  providers: [ClassSessionService],
  exports: [ClassSessionService],
})
export class ClassSessionModule {}
