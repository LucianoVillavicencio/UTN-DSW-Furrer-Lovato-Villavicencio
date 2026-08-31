import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SubscriptionState } from '../enum/subscription-state.enum';

export class SubscriptionDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  userId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId!: number;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsIn(Object.values(SubscriptionState))
  @IsOptional()
  state?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
