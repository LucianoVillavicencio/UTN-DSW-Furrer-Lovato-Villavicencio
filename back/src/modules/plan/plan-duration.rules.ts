import { NotFoundException } from '@nestjs/common';
import type { Plan } from './entity/plan.entity';
import type { PlanDuration } from './entity/plan-duration.entity';

export const ALLOWED_DURATION_MONTHS = [3, 6, 12] as const;

export interface ResolvedTerm {
  months: number;
  numDays: number;
  price: number;
  planDurationId: number | null;
}

// mysql2 returns DECIMAL columns as strings so they do not lose precision to a
// float. Every price leaving this module is a number, because it is about to
// be divided and summed.
const toPrice = (value: number | string): number => Number(value);

/**
 * The period and list price of selling `plan` for `months`.
 *
 * One month always comes from the plan itself — a months:1 duration row is
 * ignored even if one exists, so there is exactly one source of truth for the
 * monthly price. 3, 6 and 12 require a matching non-deleted PlanDuration and
 * throw when the plan does not offer one.
 */
export function resolveTerm(
  plan: Plan,
  months: number,
  durations: PlanDuration[],
): ResolvedTerm {
  if (months === 1) {
    return {
      months: 1,
      numDays: plan.numDays,
      price: toPrice(plan.price),
      planDurationId: null,
    };
  }

  const match = durations.find((d) => d.months === months && !d.deleted);
  if (!match) {
    throw new NotFoundException(
      `El plan "${plan.name}" no tiene un precio para ${months} meses.`,
    );
  }

  return {
    months: match.months,
    numDays: match.numDays,
    price: toPrice(match.price),
    planDurationId: match.id,
  };
}
