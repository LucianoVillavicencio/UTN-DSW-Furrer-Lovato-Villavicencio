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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TrainerDto } from './dto/trainer-dto';
import { TrainerService } from './trainer.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/role.enum';
import { trainerPhotoMulterOptions } from './trainer-photo.config';

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
    return this.trainerService.findAllWithClasses();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getTrainersDeleted() {
    return this.trainerService.findAllDeleted();
  }

  @Get('/:dni')
  getTrainerByDni(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.findTrainerWithClasses(dni);
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

  @Post('/:dni/photo')
  @Auth(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', trainerPhotoMulterOptions))
  uploadTrainerPhoto(
    @Param('dni', ParseIntPipe) dni: number,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException('No se recibió ninguna foto.');
    }
    return this.trainerService.setTrainerPhoto(dni, photo.filename);
  }

  @Delete('/:dni/photo')
  @Auth(Role.ADMIN)
  deleteTrainerPhoto(@Param('dni', ParseIntPipe) dni: number) {
    return this.trainerService.removeTrainerPhoto(dni);
  }
}
