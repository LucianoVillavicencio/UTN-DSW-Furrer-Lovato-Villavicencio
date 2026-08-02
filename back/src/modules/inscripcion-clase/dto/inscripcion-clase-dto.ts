import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class InscripcionClaseDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  userDni!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  turnoClaseId!: number;

  @IsDateString()
  @IsOptional()
  fechaInscripcion?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
