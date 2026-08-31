import { formatDateOnly } from './date';

// A payment's `date` is a MySQL `datetime` that reaches us as a UTC ISO string.
// Taking value.slice(0, 10) reads the UTC calendar day, so in Argentina
// (UTC-3) every payment recorded after 21:00 was filed under the next day.
// Parsing to a Date and reading its LOCAL parts is what makes the front desk's
// evening cash match the screen.
export function formatPaymentDate(value: string): string {
  // A date-only string has no time to convert; new Date() would read it as
  // midnight UTC and shift it back a day, which is the bug in reverse.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateOnly(value);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return formatDateOnly(`${year}-${month}-${day}`);
}
