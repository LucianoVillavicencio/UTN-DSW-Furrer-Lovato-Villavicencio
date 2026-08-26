import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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
  @IsOptional()
  state?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;

  // Snapshots kept for refund math. Optional here because this DTO also
  // backs the generic admin CRUD create/update, which predates them; when
  // omitted, createPayment falls back to sensible defaults rather than
  // failing the write (the entity columns are NOT NULL).
  @IsNumber()
  @IsPositive()
  @IsOptional()
  termMonths?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  monthlyPriceAtPurchase?: number;
}
