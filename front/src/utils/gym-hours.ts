// Gym opening hours. Edit here and the badge updates everywhere.
export const GYM_SCHEDULE = {
  // Times are always evaluated in Rosario's time zone, so a visitor browsing
  // from another country still sees whether the gym is open *there*.
  timeZone: 'America/Argentina/Buenos_Aires',
  // 0 = Sunday, 1 = Monday ... 6 = Saturday
  days: [1, 2, 3, 4, 5],
  openHour: 6, // opens at 06:00
  closeHour: 23, // closed from 23:00 on (22:59 still counts as open)
  label: 'Lunes a viernes 06:00–23:00 hs',
} as const;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Whether the gym is open at the given moment (defaults to now). */
export const isGymOpen = (date: Date = new Date()): boolean => {
  // Intl gives us the weekday and hour as they are in Rosario, regardless of
  // the visitor's own time zone. hourCycle 'h23' guarantees 0–23 (some
  // browsers report midnight as "24" with hour12: false).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: GYM_SCHEDULE.timeZone,
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const day = WEEKDAYS.indexOf(weekday);

  return (
    (GYM_SCHEDULE.days as readonly number[]).includes(day) &&
    hour >= GYM_SCHEDULE.openHour &&
    hour < GYM_SCHEDULE.closeHour
  );
};