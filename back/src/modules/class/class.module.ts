import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entity/class.entity';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { ClassSessionModule } from '../classSession/classSession.module';

@Module({
  imports: [TypeOrmModule.forFeature([Class]), ClassSessionModule],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
