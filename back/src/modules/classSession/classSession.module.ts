import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSession } from './entity/classSession.entity';
import { ClassRegistration } from '../classRegistration/entity/classRegistration.entity';
import { ClassSessionController } from './classSession.controller';
import { ClassSessionService } from './classSession.service';

// The registration repository is here — rather than the whole registration
// module — because adding a slot has to book the members already enrolled in
// that class at that hour, and importing the module both ways would be a cycle.
@Module({
  imports: [TypeOrmModule.forFeature([ClassSession, ClassRegistration])],
  controllers: [ClassSessionController],
  providers: [ClassSessionService],
  exports: [ClassSessionService],
})
export class ClassSessionModule {}
