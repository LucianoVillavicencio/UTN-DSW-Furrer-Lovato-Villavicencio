import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class ClassSessionDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  classId!: number;

  @IsDateString()
  @IsNotEmpty()
  dateTime!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  maxCapacity!: number;

  @IsNumber()
  @IsOptional()
  availableSpots?: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
