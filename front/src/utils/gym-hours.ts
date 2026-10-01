// Gym opening hours. Edit here and the hero badge (light + text) updates.

interface DayHours {
  open: number; // first full hour open, e.g. 6 → opens 06:00
  close: number; // closed from this hour on, e.g. 23 → 22:59 is still open
}

const WEEKDAY: DayHours = { open: 6, close: 23 };
const SATURDAY: DayHours = { open: 8, close: 20 };

export const GYM_SCHEDULE: {
  timeZone: string;
  hours: Partial<Record<number, DayHours>>;
  label: string;
} = {
  // Times are always evaluated in Rosario's time zone, so a visitor browsing
  // from another country still sees whether the gym is open *there*.
  timeZone: 'America/Argentina/Buenos_Aires',
  // Key = weekday: 0 = Sunday, 1 = Monday ... 6 = Saturday.
  // A day that is not listed (Sunday) counts as closed all day.
  hours: {
    1: WEEKDAY,
    2: WEEKDAY,
    3: WEEKDAY,
    4: WEEKDAY,
    5: WEEKDAY,
    6: SATURDAY,
  },
  label: 'Lun a vie 6 a 23 hs · Sáb 8 a 20 hs',
};

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
  const today = GYM_SCHEDULE.hours[WEEKDAYS.indexOf(weekday)];

  if (!today) return false; // closed all day (Sunday)
  return hour >= today.open && hour < today.close;
};