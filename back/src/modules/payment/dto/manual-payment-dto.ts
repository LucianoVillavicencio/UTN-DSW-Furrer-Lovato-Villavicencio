import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

// In-person payment recorded by an admin. subscriptionId is what identifies
// WHO is being charged — a user id is never accepted here, so there is no way
// to record a payment "on behalf of" someone without going through their real
// subscription.
export class ManualPaymentDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  subscriptionId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsIn(['efectivo', 'debito', 'credito', 'transferencia'])
  payMethod!: string;

  // How many months this in-person payment covers. Only meaningful for an
  // advance payment against an already-ACTIVE subscription; defaults to 1
  // when omitted.
  @IsNumber()
  @IsPositive()
  @IsOptional()
  termMonths?: number;
}
