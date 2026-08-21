// Formats the backend's date-only values ("2026-09-18", no time).
// new Date("2026-09-18") reads them as midnight UTC, and in a timezone behind
// UTC — Argentina is UTC-3 — that renders the previous day. The parts are
// parsed directly instead, never going through UTC.
export function formatDateOnly(value: string, locale = 'es-AR'): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(locale);
}
