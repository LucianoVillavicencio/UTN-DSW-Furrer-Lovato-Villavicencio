import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../common/enum/rol.enum';

// Edición de un usuario por parte de un admin (panel de Usuarios). A
// propósito no tiene `password`: UsersDto (usado por el PUT /user viejo)
// la exige en cada update, lo que fuerza a mandar algo que termina
// guardado sin hashear — este DTO evita ese hueco y se enfoca en los
// campos que un admin realmente necesita tocar.
export class AdminUpdateUserDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  surname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
