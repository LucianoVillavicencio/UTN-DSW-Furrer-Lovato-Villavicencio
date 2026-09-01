import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { ChargeOrderMethod } from '../enum/chargeOrder-method.enum';

// Arms a front-desk charge at the counter. adminId is never accepted here —
// it comes from the JWT via @ActiveUser(), same rule as ManualPaymentDto's
// note on not accepting a user id directly.
export class CreateChargeOrderDto {
  @IsInt()
  @IsPositive()
  userId!: number;

  @IsInt()
  @IsPositive()
  planId!: number;

  // MONTHS, never a day count — the backend resolves numDays itself through
  // resolveTerm, so a forged value cannot buy free access.
  @IsInt()
  @IsIn([1, 3, 6, 12])
  months!: number;

  // Admin-editable on purpose: the front desk gives discounts.
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(ChargeOrderMethod)
  method!: ChargeOrderMethod;

  // The terminal id for 'point', the external_pos_id for 'qr' — see the
  // entity's own comment on collectionPointId.
  @IsString()
  @IsNotEmpty()
  collectionPointId!: string;
}
