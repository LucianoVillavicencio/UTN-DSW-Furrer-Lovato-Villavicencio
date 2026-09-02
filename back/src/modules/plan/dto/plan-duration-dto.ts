import { IsIn, IsInt, IsNumber, IsPositive } from 'class-validator';
import { ALLOWED_DURATION_MONTHS } from '../plan-duration.rules';

// planId is NOT here: it comes from the route parameter, the same rule
// ChangePlanDto follows for the user id. The global forbidNonWhitelisted pipe
// turns a body that carries one into a 400 rather than a silent override.
export class PlanDurationDto {
  @IsInt()
  @IsIn([...ALLOWED_DURATION_MONTHS], {
    message: 'La duración tiene que ser de 3, 6 o 12 meses.',
  })
  months!: number;

  @IsInt()
  @IsPositive()
  numDays!: number;

  @IsNumber()
  @IsPositive()
  price!: number;
}
