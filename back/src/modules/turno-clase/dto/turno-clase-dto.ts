import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class TurnoClaseDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  claseId!: number;

  @IsDateString()
  @IsNotEmpty()
  fechaHora!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cupoMaximo!: number;

  @IsNumber()
  @IsOptional()
  cupoDisponible?: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
