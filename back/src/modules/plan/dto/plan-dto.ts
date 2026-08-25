import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
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

  // Trimmed before validating: @IsNotEmpty only rejects an empty string, so a
  // name of spaces would otherwise be stored and render as a nameless card.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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

  // null means unlimited, so @IsOptional is what lets it through: it skips
  // validation for both undefined and null.
  @IsInt()
  @Min(0)
  @IsOptional()
  maxClasses?: number | null;

  @IsBoolean()
  @IsOptional()
  highlighted?: boolean;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
