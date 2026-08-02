import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SuscripcionDto {
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
  planId!: number;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio!: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin!: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
