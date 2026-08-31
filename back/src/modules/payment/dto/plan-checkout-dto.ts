import { IsIn, IsInt, IsNumber, IsPositive, IsString } from 'class-validator';

// One in-person sale: the plan, how long for, how much was actually taken and
// how. Replaces the old "assign a plan, then separately record a payment
// against its subscription" pair for the Pagos tab only — the new-member
// wizard's separate plan and cobro steps keep using assignPlanToMember and
// POST /Payment/manual.
export class PlanCheckoutDto {
  @IsInt()
  @IsPositive()
  userId!: number;

  @IsInt()
  @IsPositive()
  planId!: number;

  // MONTHS, never a day count. The amount is deliberately admin-editable —
  // the front desk gives discounts — but a client-supplied period would be a
  // free-access hole, so the backend resolves numDays itself from the plan or
  // its PlanDuration.
  @IsInt()
  @IsIn([1, 3, 6, 12])
  months!: number;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsIn(['efectivo', 'debito', 'credito', 'transferencia'])
  payMethod!: string;
}
