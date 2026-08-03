import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ClassDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  typeClassId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  trainerDni!: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
