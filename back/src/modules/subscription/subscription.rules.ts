// Formats using the LOCAL date parts, not UTC, so that "today" in the server's
// timezone does not shift to the previous or next day on its way into a MySQL
// 'date' column.
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The paid period of a subscription on a plan of `numDays`, counted from
// `from` (today by default). Shared by changePlan and activate so a
// subscription that is created and one that is promoted cannot end up with
// their dates computed differently.
//
// Dates are 'YYYY-MM-DD' strings rather than a Date carrying a time, so the
// MySQL 'date' column cannot shift them by a day through timezone conversion —
// the same approach the frontend already uses in Plan.tsx with
// toISOString().split('T')[0]. The cast is what lets a string reach a column
// TypeORM types as Date.
export function subscriptionPeriod(numDays: number, from: Date = new Date()) {
  const endJs = new Date(from);
  endJs.setDate(endJs.getDate() + numDays);
  return {
    startDate: toDateOnly(from) as unknown as Date,
    endDate: toDateOnly(endJs) as unknown as Date,
  };
}

// Whether a subscription whose paid period ends on `endDate` is still current
// on `today`, both as 'YYYY-MM-DD'. INCLUSIVE of endDate: a 30-day plan bought
// on day 0 ends on day 30 and the member paid for day 30 itself, so access
// holds through it and lapses on day 31.
//
// The entity types endDate as Date but a MySQL 'date' column comes back from
// the driver as a string, and subscriptionPeriod writes strings cast to Date —
// so both forms genuinely occur and both are accepted here. Lexicographic
// comparison is correct for zero-padded 'YYYY-MM-DD'.
export function isCurrentOn(endDate: Date | string, today: string): boolean {
  const end =
    endDate instanceof Date
      ? toDateOnly(endDate)
      : String(endDate).slice(0, 10);
  return end >= today;
}

// The calendar day after `dateOnly`, parsed from its local YYYY-MM-DD parts —
// not `new Date(dateOnly)`, which JS reads as UTC midnight and which shifts a
// day in Argentina (UTC-3). This is the same trap audit finding 3 documents
// for a `datetime` column; here it is a `date` column but the parsing rule
// that avoids it is identical.
export function dayAfter(dateOnly: string): Date {
  const [year, month, day] = dateOnly.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day + 1);
}
