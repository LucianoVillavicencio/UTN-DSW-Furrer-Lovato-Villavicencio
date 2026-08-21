// Formato argentino: punto para miles, coma para decimales.
//
// Un intento anterior reformateaba el input EN CADA TECLA (insertando el
// punto de miles a medida que se escribía) y trataba cualquier coma como
// "ahora empiezan los centavos", tope 2 dígitos. Eso rompía con "19,995"
// (alguien tipeando la coma como separador de miles, no como decimal): el
// "5" final se descartaba en silencio y quedaba "19,99" (~$20) en vez de
// $19.995. La lección: no se puede reformatear mientras la persona todavía
// está escribiendo sin adivinar mal su intención.
//
// Ahora el input es texto libre (sin tocar lo que se tipeó) y se interpreta
// una sola vez, al terminar — con un preview en vivo (ver PlansSection)
// para que quede claro cómo se va a interpretar antes de guardar.

// Interpreta el texto que alguien tipeó como precio, aceptando los formatos
// reales con los que la gente escribe un monto en pesos argentinos:
//   "19995"          -> 19995 (sin separador, siempre literal)
//   "19995.50" / "19995,50"        -> 19995.50 (separador único = decimal)
//   "19.995" / "19,995"            -> 19995 (separador único + EXACTO 3
//                                     dígitos después = separador de miles,
//                                     no decimal — los centavos son 1 o 2
//                                     dígitos, nunca 3)
//   "19,995.00" / "19.995,00"      -> 19995.00 (dos separadores: el más a
//                                     la derecha es el decimal, el otro se
//                                     descarta como separador de miles)
export function parsePriceInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return NaN;

  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  // Ambos separadores presentes: el de más a la derecha es el decimal.
  if (lastComma !== -1 && lastDot !== -1) {
    const normalized =
      lastComma > lastDot
        ? trimmed.replace(/\./g, "").replace(",", ".")
        : trimmed.replace(/,/g, "");
    return Number(normalized);
  }

  // Un solo tipo de separador (puede aparecer más de una vez, ej.
  // "1.234.567"): si el último grupo tiene exactamente 3 dígitos, es de
  // miles (nadie tiene 3 dígitos de centavos) y se descartan todas sus
  // apariciones; si no, es decimal.
  const singleSepChar = lastComma !== -1 ? "," : lastDot !== -1 ? "." : null;
  if (singleSepChar) {
    const lastIndex = trimmed.lastIndexOf(singleSepChar);
    const trailingDigits = trimmed.length - lastIndex - 1;
    const isThousandsSeparator =
      trailingDigits === 3 && /^\d+$/.test(trimmed.slice(lastIndex + 1));
    const normalized = isThousandsSeparator
      ? trimmed.split(singleSepChar).join("")
      : trimmed.replace(singleSepChar, ".");
    return Number(normalized);
  }

  return Number(trimmed);
}

// Muestra un precio en pesos: sin decimales si son ,00 (ej. 10000 ->
// "10.000"), con 2 decimales si no (ej. 19995.5 -> "19.995,50"). Acepta
// string porque las columnas DECIMAL de MySQL suelen llegar como string
// desde la API (mysql2 evita el redondeo de floats), no como number.
export function formatPriceDisplay(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return String(value);

  const hasCents = Math.round(num * 100) % 100 !== 0;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(num);
}
