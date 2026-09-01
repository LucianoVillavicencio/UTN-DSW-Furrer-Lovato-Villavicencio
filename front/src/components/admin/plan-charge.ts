import { parsePriceInput } from '../../lib/currency';
import type { DurationMonths, Plan, PlanDuration } from '../../types/plan';

export type ChargeMonths = 1 | DurationMonths;

// Moved here from RegisterPaymentForm, which was the only owner: both that
// form and the new PlanChargeForm offer the same four, and the backend's
// @IsIn on PlanCheckoutDto.payMethod is the list this must match.
export const PAY_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
] as const;

// The six methods the counter offers. 'point' and 'qr' are dispatched to
// Mercado Pago and settle asynchronously through the webhook; the rest are
// recorded immediately by plan-checkout.
export const CHARGE_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'point', label: 'Tarjeta (Point)' },
  { value: 'qr', label: 'QR' },
] as const;

export type ChargeMethod = (typeof CHARGE_METHODS)[number]['value'];

// Also narrows: submit() below relies on this to type the charge-order
// payload's `method` field without a cast.
export const isOrderMethod = (method: string): method is 'point' | 'qr' =>
  method === 'point' || method === 'qr';

export interface ChargeFormInput {
  planId: number | '';
  months: ChargeMonths;
  amountText: string;
}

const monthsLabel = (months: ChargeMonths): string =>
  months === 1 ? '1 mes' : `${months} meses`;

// One month is always on offer and always reads the plan's own price. The
// longer terms appear only when the plan actually has a PlanDuration for them.
export const durationOptionsFor = (
  plan: Plan | null,
  durations: PlanDuration[],
): { months: ChargeMonths; label: string }[] => {
  if (!plan) return [];
  const longer = durations
    .filter((d) => !d.deleted)
    .map((d) => d.months)
    .sort((a, b) => a - b);
  return [1 as ChargeMonths, ...longer].map((months) => ({
    months,
    label: monthsLabel(months),
  }));
};

// Mirrors the backend's resolveTerm. Returns null when the plan does not offer
// that term, so the caller can say so instead of leaving stale money on screen.
export const resolvedPriceFor = (
  plan: Plan | null,
  durations: PlanDuration[],
  months: ChargeMonths,
): number | null => {
  if (!plan) return null;
  // DECIMAL columns arrive as strings; Number() is not optional here.
  if (months === 1) return Number(plan.price);
  const match = durations.find((d) => d.months === months && !d.deleted);
  return match ? Number(match.price) : null;
};

// Same checks the API runs, so the admin sees the problem without a round trip.
export const findChargeFormError = (input: ChargeFormInput): string | null => {
  if (!input.planId) return 'Elegí un plan.';
  const amount = parsePriceInput(input.amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Ingresá un monto válido.';
  }
  return null;
};
