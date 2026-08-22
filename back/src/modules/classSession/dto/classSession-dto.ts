import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Matches,
  Max,
  Min,
} from 'class-validator';

// 'HH:MM' or 'HH:MM:SS' — what an <input type="time"> sends and what MySQL
// gives back from a 'time' column.
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class ClassSessionDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  classId!: number;

  // 1 = Monday … 6 = Saturday. Sunday (0) is rejected: the gym is closed.
  @IsInt()
  @Min(1)
  @Max(6)
  weekday!: number;

  @Matches(TIME_PATTERN, {
    message: 'La hora tiene que tener el formato HH:MM.',
  })
  startTime!: string;

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

// One save from the admin's weekly grid: every combination of the ticked
// weekdays and hours becomes a slot, so "Funcional on Mon/Wed/Fri at 8, 14 and
// 19" is one request instead of nine.
export class WeeklyClassSessionsDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  classId!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @IsArray()
  @ArrayNotEmpty()
  @Matches(TIME_PATTERN, {
    each: true,
    message: 'Cada hora tiene que tener el formato HH:MM.',
  })
  times!: string[];

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  maxCapacity!: number;
}
