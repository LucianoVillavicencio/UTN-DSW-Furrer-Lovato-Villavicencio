import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrainerDto } from './dto/trainer-dto';
import { TrainerService } from './trainer.service';

@Controller('api/v1/trainer')
@ApiTags('Trainers')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Post()
  createTrainer(@Body() trainerDto: TrainerDto) {
    return this.trainerService.createTrainer(trainerDto);
  }

  @Get()
  getTrainers() {
    return this.trainerService.findAll();
  }

  @Get('filter/deleted')
  getTrainersDeleted() {
    return this.trainerService.findAllDeleted();
  }

  @Get('/:dni')
  getTrainerByDni(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.findTrainer(dni);
  }

  @Put()
  updateTrainer(@Body() trainerDto: TrainerDto) {
    return this.trainerService.updateTrainer(trainerDto);
  }

  @Delete('/:dni')
  deleteTrainer(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.deleteTrainer(dni);
  }

  @Patch('/restore/:dni')
  restoreTrainer(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.restoreTrainer(dni);
  }
}
