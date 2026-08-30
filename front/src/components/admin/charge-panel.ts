import type { Payment } from '../../types/payment';

// Mirrors the backend's poll cadence for the front-desk charge panel — see
// ChargePanel.tsx, which polls GET /charge-order/:id on this interval while
// shouldKeepPolling(...) below stays true.
export const POLL_INTERVAL_MS = 2000;

// Terminal states: once a charge order reaches one of these, Mercado Pago (or
// the admin, via cancel) is done with it and polling has nothing left to
// learn.
const TERMINAL_STATUSES = ['pagada', 'cancelada', 'expirada', 'error'];

// Whether the panel should keep polling GET /charge-order/:id. Mirrors the
// backend's own isExpired (back/src/modules/chargeOrder/chargeOrder.rules.ts)
// exactly: an order expiring AT `now` already reads as expired, not
// still-valid for one more instant, so this compares with >=, never >. Must
// agree with the backend's notion of expiry rather than invent its own
// timeout, since the poll result and any subsequent cancel both use the same
// server-side clock.
export function shouldKeepPolling(
  status: string,
  expiresAt: string,
  now: Date,
): boolean {
  if (TERMINAL_STATUSES.includes(status)) return false;
  return now.getTime() < new Date(expiresAt).getTime();
}

// User-facing Spanish copy shown prominently while a charge order is live.
// Exact strings, verbatim — see the brief's table.
export function statusLabel(
  status: string,
  method: 'point' | 'qr' | 'efectivo',
): string {
  if (status === 'pendiente') {
    if (method === 'point') return 'Esperando tarjeta en Point...';
    if (method === 'qr') return 'Esperando escaneo del QR...';
  }
  if (status === 'pagada') return '¡Pago aprobado!';
  if (status === 'error') return 'Pago rechazado';
  if (status === 'cancelada') return 'Cobro cancelado';
  if (status === 'expirada') return 'El cobro venció';
  return status;
}

// Cash is a flat, immediate POST /Payment/manual with no charge order and no
// planTermId — see the "term selector applies only to point/qr" ruling.
// Point and QR both go through POST /charge-order.
export function needsChargeOrder(method: 'point' | 'qr' | 'efectivo'): boolean {
  return method !== 'efectivo';
}

// YYYY-MM-DD in local time — deliberately not toISOString(), which reads in
// UTC and can land on the wrong calendar day near midnight in a timezone
// behind UTC (Argentina is UTC-3).
function localDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The advance-payment warning's data source (see the Ruling): the backend has
// no flag for "this subscription was already auto-renewed today," so the
// panel infers it from the member's payment history — a payment recorded by
// the renewal job always carries payMethod: 'mercadopago'
// (back/src/modules/renewal/renewal.service.ts:160,191).
export function hasAutoRenewedToday(
  payments: Pick<Payment, 'payMethod' | 'date'>[],
  today: Date,
): boolean {
  const todayStr = localDateOnly(today);
  return payments.some(
    (p) => p.payMethod === 'mercadopago' && p.date.slice(0, 10) === todayStr,
  );
}
