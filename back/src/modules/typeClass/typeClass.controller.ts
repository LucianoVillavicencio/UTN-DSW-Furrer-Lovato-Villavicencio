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
import { TypeClassDto } from './dto/typeClass-dto';
import { TypeClassService } from './typeClass.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Role } from '../../common/enum/rol.enum';

@Controller('api/v1/typeClass')
@ApiTags('Types of classes')
export class TypeClassController {
  constructor(private readonly typeClassService: TypeClassService) {}

  @Post()
  @Auth(Role.ADMIN)
  createTypeClass(@Body() typeClassDto: TypeClassDto) {
    return this.typeClassService.createTypeClass(typeClassDto);
  }

  // Lectura pública: la usa el selector de tipo de clase en el form de Clases.
  @Get()
  getTypesClass() {
    return this.typeClassService.findAll();
  }

  @Get('filter/deleted')
  @Auth(Role.ADMIN)
  getTypeClassDeleted() {
    return this.typeClassService.findAllDeleted();
  }

  @Get('/:id')
  getTypeClassById(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.findTypeClass(id);
  }

  @Put()
  @Auth(Role.ADMIN)
  updateTypeClass(@Body() typeClassDto: TypeClassDto) {
    return this.typeClassService.updateTypeClass(typeClassDto);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  deleteTypeClass(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.deleteTypeClass(id);
  }

  @Patch('/restore/:id')
  @Auth(Role.ADMIN)
  restoreTypeClass(@Param('id', ParseIntPipe) id: number) {
    return this.typeClassService.restoreTypeClass(id);
  }
}
