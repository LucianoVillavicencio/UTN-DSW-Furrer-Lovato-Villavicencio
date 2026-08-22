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
  // 0 = no classes, N = up to N different classes at a time, null = unlimited.
  maxClasses: number | null;
}

/**
 * How a plan's class allowance reads on screen. `long` is the sentence the
 * public plan card shows, `short` the one that fits an admin table cell.
 */
export function classAllowanceLabel(
  maxClasses: number | null | undefined,
  variant: 'long' | 'short' = 'long',
): string {
  if (maxClasses === null) {
    return variant === 'short' ? 'Ilimitadas' : 'Clases grupales ilimitadas';
  }
  if (!maxClasses) {
    return variant === 'short' ? 'Sin clases' : 'Sin clases grupales';
  }
  if (maxClasses === 1) {
    return variant === 'short' ? '1 clase' : '1 clase grupal incluida';
  }
  return variant === 'short'
    ? `${maxClasses} clases`
    : `${maxClasses} clases grupales incluidas`;
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
    // `??` would read an absent field as "unlimited"; only an explicit null
    // means that, so a payload without the field falls back to no classes.
    maxClasses: plan.maxClasses === undefined ? 0 : plan.maxClasses,
  };
}
