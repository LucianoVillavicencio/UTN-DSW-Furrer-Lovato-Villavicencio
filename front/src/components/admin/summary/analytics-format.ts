// Pure formatting helpers for the owner analytics panel. User-facing, so
// Spanish — matches the rest of the admin UI.

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

// A revenue point's `period` is 'YYYY-MM' or 'YYYY-MM-DD', formed by the
// backend's DATE_FORMAT. Anything else (an unexpected value, a test fixture)
// passes through unchanged rather than crashing the panel.
export const periodLabel = (period: string): string => {
  const parts = period.split('-');
  if (parts.length === 2) {
    const [year, month] = parts;
    const monthIndex = Number(month) - 1;
    const label = MESES_CORTOS[monthIndex];
    if (label) return `${label} ${year}`;
  }
  if (parts.length === 3) {
    const [, month, day] = parts;
    const monthIndex = Number(month) - 1;
    const label = MESES_CORTOS[monthIndex];
    if (label) return `${Number(day)} ${label}`;
  }
  return period;
};

// A percentage of the total, clamped to [0, 100] and never NaN — a
// proportional bar with width NaN% renders as nothing, which used to read as
// "this row has zero share" instead of "the total was zero".
export const shareOf = (value: number, total: number): number =>
  total <= 0 ? 0 : Math.min(100, (value / total) * 100);
