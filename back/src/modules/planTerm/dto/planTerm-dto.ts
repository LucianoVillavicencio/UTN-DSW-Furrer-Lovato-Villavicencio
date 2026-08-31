import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class PlanTermDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId!: number;

  // Upper bound (12) is a business rule enforced in PlanTermService, not
  // here, so the service's ConflictException fires the same way whether the
  // call comes through the controller or straight from another service.
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  months!: number;

  // The TOTAL price of the whole term, not a per-month figure — see
  // PlanTerm.price.
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price!: number;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
