// A turno is a weekly slot, so the form edits weekdays and hours, never a date.
// Creating takes several of each at once — "Funcional on Mon/Wed/Fri at 8, 14
// and 19" is one save — while editing moves a single existing slot, so both
// lists hold exactly one value then.
// Kept out of the .tsx so that file exports nothing but its component, which is
// what Fast Refresh needs.
export interface ClassSessionFormState {
  id?: number;
  classId: number;
  weekdays: number[];
  // 'HH:MM', as <input type="time"> speaks it.
  times: string[];
  maxCapacity: string;
}

export const emptyClassSessionForm: ClassSessionFormState = {
  classId: 0,
  weekdays: [],
  times: [],
  maxCapacity: '20',
};

// Hourly class starts across opening hours (the last class starts at 21:00).
// Off-the-hour starts such as 18:30 come in through "Otro horario" and then
// show up among these chips too.
export const PRESET_TIMES: string[] = Array.from(
  { length: 15 },
  (_, i) => `${String(7 + i).padStart(2, '0')}:00`,
);

const isTimeOfDay = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);

// 'HH:MM' sorts chronologically as plain strings.
const sortedUnique = (times: string[]): string[] => [...new Set(times)].sort();

export const timeChips = (selected: string[]): string[] =>
  sortedUnique([...PRESET_TIMES, ...selected]);

// isSingle: editing moves one existing slot, so a pick replaces the hour
// instead of adding a second one.
export const toggleTime = (
  times: string[],
  time: string,
  isSingle: boolean,
): string[] => {
  if (isSingle) return [time];
  return times.includes(time)
    ? times.filter((t) => t !== time)
    : sortedUnique([...times, time]);
};

export const addCustomTime = (
  times: string[],
  time: string,
  isSingle: boolean,
): string[] => {
  if (!isTimeOfDay(time)) return times;
  if (isSingle) return [time];
  return sortedUnique([...times, time]);
};
