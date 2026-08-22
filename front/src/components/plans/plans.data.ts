import type { Plan, PlanFeature } from '../../types/plan';
import { formatPriceDisplay } from '../../lib/currency';

export type { PlanFeature };

export interface MembershipPlan {
  id?: number;
  name: string;
  description: string;
  price: string;
  numericPrice: number;
  period: string;
  numDays: number;
  highlight: boolean;
  features: PlanFeature[];
}

/**
 * Maps a backend Plan entity to the shape the plan cards render.
 *
 * It only formats what the backend stores. Features and description used to be
 * guessed from the plan name when they were missing, which advertised benefits
 * nobody had configured: a plan named anything other than "Básico" or "Elite"
 * fell into the "Premium" set and claimed personal training and nutrition
 * tracking it did not include.
 */
export function enrichBackendPlan(plan: Plan): MembershipPlan {
  const periodStr =
    plan.numDays === 30
      ? '/mes'
      : plan.numDays === 365
        ? '/año'
        : `/${plan.numDays} días`;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? '',
    price: `$${formatPriceDisplay(plan.price)}`,
    numericPrice: Number(plan.price),
    period: periodStr,
    numDays: plan.numDays || 30,
    // The badge is a stored per-plan flag the admin sets, never a guess from
    // the name: renaming a plan used to turn all three into "Más popular".
    highlight: plan.highlighted === true,
    features: plan.features ?? [],
  };
}
