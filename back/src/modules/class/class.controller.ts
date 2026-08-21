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
import { ClassService } from './class.service';
import { ClassDto } from './dto/class-dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/rol.enum';

@Controller('api/v1/class')
@ApiTags('Classes')

// Los GET del catálogo quedan públicos (la landing y /class los muestran sin
// login). Todo lo que modifica datos lleva @Auth(Role.ADMIN) en el endpoint.
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Auth(Role.ADMIN)
  createClass(@Body() claseDto: ClassDto) {
    return this.classService.createClass(claseDto);
  }

  // Lectura pública: la usan las páginas /class y el picker de turnos.
  @Get()
  getClasses() {
    return this.classService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getClassesDeleted() {
    return this.classService.findAllDeleted();
  }

  @Get('/:id')
  getClassById(@Param('id', ParseIntPipe) id: number) {
    return this.classService.findClass(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateClass(@Body() claseDto: ClassDto) {
    return this.classService.updateClass(claseDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deleteClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.deleteClass(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restoreClass(@Param('id', ParseIntPipe) id: number) {
    return this.classService.restoreClass(id);
  }
}
