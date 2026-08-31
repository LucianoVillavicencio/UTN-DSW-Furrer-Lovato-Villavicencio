import {
  IsEnum,
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
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  subscriptionId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planTermId!: number;

  @IsEnum(ChargeOrderMethod)
  method!: ChargeOrderMethod;

  // The terminal id for 'point', the external_pos_id for 'qr' — see the
  // entity's own comment on collectionPointId.
  @IsString()
  @IsNotEmpty()
  collectionPointId!: string;
}
