// Formatea fechas 'date-only' del backend (ej. "2026-09-18", sin hora).
// new Date("2026-09-18") las interpreta como medianoche UTC; en un
// timezone detrás de UTC (ej. Argentina, UTC-3) eso muestra el día
// anterior. Parseamos los componentes directo, sin pasar por UTC.
export function formatDateOnly(value: string, locale = "es-AR"): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(locale);
}
