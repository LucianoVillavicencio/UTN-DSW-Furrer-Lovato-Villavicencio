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
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/rol.enum';

@Controller('api/v1/trainer')
@ApiTags('Trainers')

// Mismo criterio que ClassController: el listado de profesores es público
// (página /trainers) y el alta/baja/modificación sólo para ADMIN.
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Post()
  @Auth(Role.ADMIN)
  createTrainer(@Body() trainerDto: TrainerDto) {
    return this.trainerService.createTrainer(trainerDto);
  }

  @Get()
  getTrainers() {
    return this.trainerService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getTrainersDeleted() {
    return this.trainerService.findAllDeleted();
  }

  @Get('/:dni')
  getTrainerByDni(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.findTrainer(dni);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateTrainer(@Body() trainerDto: TrainerDto) {
    return this.trainerService.updateTrainer(trainerDto);
  }

  @Delete('/:dni')
  @Auth(Role.ADMIN)
  deleteTrainer(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.deleteTrainer(dni);
  }

  @Patch('/restore/:dni')
  @Auth(Role.ADMIN)
  restoreTrainer(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.restoreTrainer(dni);
  }
}
