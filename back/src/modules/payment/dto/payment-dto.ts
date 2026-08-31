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
import { PaymentState } from '../enum/payment-state.enum';

export class PaymentDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  subscriptionId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  payMethod!: string;

  @IsString()
  @IsIn(Object.values(PaymentState))
  @IsOptional()
  state?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
