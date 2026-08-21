// Argentine format: dot for thousands, comma for decimals.
//
// An earlier attempt reformatted the input ON EVERY KEYSTROKE, inserting the
// thousands dot as the user typed and treating any comma as "cents start here",
// capped at 2 digits. That broke "19,995" — someone typing the comma as a
// thousands separator rather than a decimal one: the trailing "5" was dropped
// silently and the value became "19,99" (~$20) instead of $19.995. The lesson
// is that you cannot reformat while someone is still typing without guessing
// their intent wrong.
//
// The input is now free text, left exactly as typed, and interpreted once when
// the user is done — with a live preview (see PlansSection) so the reading is
// visible before saving.

// Reads text someone typed as a price, accepting the formats people actually
// use for an amount in Argentine pesos:
//   "19995"                   -> 19995 (no separator, always literal)
//   "19995.50" / "19995,50"   -> 19995.50 (a single separator means decimal)
//   "19.995" / "19,995"       -> 19995 (single separator with EXACTLY 3 digits
//                                after it is a thousands separator, not a
//                                decimal one — cents are 1 or 2 digits, never 3)
//   "19,995.00" / "19.995,00" -> 19995.00 (two separators: the rightmost is the
//                                decimal one, the other is thousands)
export function parsePriceInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return NaN;

  const lastComma = trimmed.lastIndexOf(',');
  const lastDot = trimmed.lastIndexOf('.');

  // Both separators present: the rightmost one is the decimal separator.
  if (lastComma !== -1 && lastDot !== -1) {
    const normalized =
      lastComma > lastDot
        ? trimmed.replace(/\./g, '').replace(',', '.')
        : trimmed.replace(/,/g, '');
    return Number(normalized);
  }

  // A single kind of separator, possibly repeated ("1.234.567"): if the last
  // group has exactly 3 digits it is a thousands separator — nobody has 3 digits
  // of cents — and every occurrence is dropped; otherwise it is a decimal.
  const singleSepChar = lastComma !== -1 ? ',' : lastDot !== -1 ? '.' : null;
  if (singleSepChar) {
    const lastIndex = trimmed.lastIndexOf(singleSepChar);
    const trailingDigits = trimmed.length - lastIndex - 1;
    const isThousandsSeparator =
      trailingDigits === 3 && /^\d+$/.test(trimmed.slice(lastIndex + 1));
    const normalized = isThousandsSeparator
      ? trimmed.split(singleSepChar).join('')
      : trimmed.replace(singleSepChar, '.');
    return Number(normalized);
  }

  return Number(trimmed);
}

// Renders a price in pesos: no decimals when they are ,00 (10000 -> "10.000"),
// two decimals otherwise (19995.5 -> "19.995,50"). It accepts a string because
// MySQL DECIMAL columns usually arrive from the API as strings — mysql2 avoids
// float rounding — rather than as numbers.
export function formatPriceDisplay(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return String(value);

  const hasCents = Math.round(num * 100) % 100 !== 0;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(num);
}
