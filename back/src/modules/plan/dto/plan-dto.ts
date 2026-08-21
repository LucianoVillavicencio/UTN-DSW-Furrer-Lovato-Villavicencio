import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PlanFeatureDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsBoolean()
  available!: boolean;
}

export class PlanDto {
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
  price!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  numDays!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  @IsOptional()
  features?: PlanFeatureDto[];

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
