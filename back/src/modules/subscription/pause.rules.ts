/**
 * Maximum number of consecutive days a subscription can be paused.
 * Note: This is a reporting threshold only. exceedsPauseCap() alerts when a
 * pause runs past this limit, but daysOwedBack() returns every frozen day
 * without truncation. Silently confiscating paid time would be worse than an
 * admin noticing and resolving a stale pause.
 */
export const MAX_PAUSE_DAYS = 90;

/**
 * Converts a Date object to 'YYYY-MM-DD' string using local date parts.
 * Ensures "today" in the server's timezone does not shift to a previous or
 * next day when stored in a MySQL 'date' column.
 */
function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a Date or 'YYYY-MM-DD' string to a canonical date string.
 * Mirrors the tolerance pattern used in isCurrentOn and renewalPeriod:
 * a MySQL 'date' column comes back from the driver as a string, and
 * subscriptionPeriod writes strings cast to Date, so both forms genuinely
 * occur and both must be accepted.
 */
function normalize(date: Date | string): string {
  if (date instanceof Date) {
    return dateToString(date);
  }
  return String(date).slice(0, 10);
}

/**
 * Parses a 'YYYY-MM-DD' string into a JavaScript Date at midnight local time.
 * Used to calculate the number of days between two dates.
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns the number of whole days a subscription has been paused since pausedAt.
 * Accepts both Date objects and 'YYYY-MM-DD' strings for pausedAt and today.
 * Clamps at zero: if today is somehow before pausedAt (clock skew or hand-edited
 * row), returns 0 rather than a negative number, to never shorten the membership.
 *
 * @param pausedAt - The date the subscription was paused (Date | string)
 * @param today - The current date (Date | string)
 * @returns Number of whole days frozen, clamped at 0
 */
export function daysOwedBack(pausedAt: Date | string, today: Date | string): number {
  const pausedStr = normalize(pausedAt);
  const todayStr = normalize(today);

  const pausedDate = parseDate(pausedStr);
  const todayDate = parseDate(todayStr);

  const diffMs = todayDate.getTime() - pausedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Reports whether a pause has exceeded the maximum allowed duration.
 * This is a reporting function only, not an enforcement mechanism. When true,
 * an admin should investigate the pause; daysOwedBack() will still return the
 * full count of frozen days without truncation.
 *
 * @param pausedAt - The date the subscription was paused (Date | string)
 * @param today - The current date (Date | string)
 * @returns true if the pause duration exceeds MAX_PAUSE_DAYS
 */
export function exceedsPauseCap(pausedAt: Date | string, today: Date | string): boolean {
  const days = daysOwedBack(pausedAt, today);
  return days > MAX_PAUSE_DAYS;
}
