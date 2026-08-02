import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ClaseDto {
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
  tipoClaseId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  profesorDni!: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
