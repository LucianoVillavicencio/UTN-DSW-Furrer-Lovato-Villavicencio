import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class PlanDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  precio!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  duracionDias!: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
