import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

// userId never travels in this body: the controller resolves it from the JWT
// (@ActiveUser), the same way UpdateProfileDto does for /user/me.
export class ChangePlanDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId!: number;

  // Which multi-month term to buy. Optional: when omitted, changePlan falls
  // back to the plan's 1-month term (see subscriptionService.changePlan).
  @IsNumber()
  @IsPositive()
  @IsOptional()
  planTermId?: number;
}
