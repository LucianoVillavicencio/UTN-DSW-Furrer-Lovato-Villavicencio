import { parsePriceInput } from '../../lib/currency';
import type { DurationMonths, PlanDuration } from '../../types/plan';

export const DURATION_MONTHS: DurationMonths[] = [3, 6, 12];

export interface DurationFormState {
  months: DurationMonths;
  // Free text parsed on save, the same reason PlansSection keeps the plan's
  // own price as text: Number("19.") is 19, so converting on every keystroke
  // makes "19.995" impossible to finish typing.
  numDaysText: string;
  priceText: string;
}

export const availableMonths = (existing: PlanDuration[]): DurationMonths[] =>
  DURATION_MONTHS.filter((m) => !existing.some((d) => d.months === m && !d.deleted));

// Same checks the API runs, so the admin sees the problem without a round trip.
export const findDurationFormError = (
  form: DurationFormState,
  others: PlanDuration[],
): string | null => {
  if (others.some((d) => d.months === form.months && !d.deleted)) {
    return `El plan ya tiene un precio para ${form.months} meses.`;
  }

  const numDays = Number(form.numDaysText.trim());
  if (!Number.isInteger(numDays) || numDays <= 0) {
    return 'Los días tienen que ser un número entero mayor a cero.';
  }

  const price = parsePriceInput(form.priceText);
  if (!Number.isFinite(price)) {
    return 'No se entiende el precio. Escribilo como 19995 o 19.995,50.';
  }
  if (price <= 0) {
    return 'El precio tiene que ser mayor a cero.';
  }

  return null;
};

export const toDurationPayload = (form: DurationFormState) => ({
  months: form.months,
  numDays: Number(form.numDaysText.trim()),
  price: parsePriceInput(form.priceText),
});
