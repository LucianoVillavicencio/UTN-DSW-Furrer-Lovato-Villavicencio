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
import { Role } from '../../common/enum/role.enum';

@Controller('api/v1/trainer')
@ApiTags('Trainers')

// Same criterion as ClassController: the trainer listing is public (the
// /trainers page) and creating, updating or deleting is ADMIN-only.
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Post()
  @Auth(Role.ADMIN)
  createTrainer(@Body() trainerDto: TrainerDto) {
    return this.trainerService.createTrainer(trainerDto);
  }

  // Public read: used by the /trainers page.
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
