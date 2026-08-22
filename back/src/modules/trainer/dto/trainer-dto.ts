import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  normalizeCertifications,
  normalizeInstagramHandle,
} from '../trainer.rules';

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TrainerWorkShiftDto {
  @IsInt()
  @Min(1)
  @Max(6)
  weekday!: number;

  @Matches(TIME_OF_DAY, {
    message: 'La hora de inicio debe tener el formato HH:MM.',
  })
  startTime!: string;

  @Matches(TIME_OF_DAY, {
    message: 'La hora de fin debe tener el formato HH:MM.',
  })
  endTime!: string;
}

export class TrainerDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  dni!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  surname!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  speciality?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeInstagramHandle(value) : value,
  )
  @IsString()
  @MaxLength(100)
  @IsOptional()
  instagram?: string;

  @Transform(({ value }: { value: unknown }) => normalizeCertifications(value))
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  certifications?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainerWorkShiftDto)
  @IsOptional()
  workSchedule?: TrainerWorkShiftDto[];

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
