// Pure helpers behind TrainerScheduleField's weekly grid: at most one shift
// per weekday (the API rejects two on the same day), kept sorted Monday to
// Saturday. Unit-tested in trainer-schedule.test.ts.

import type { TrainerWorkShift } from '../../../types/trainer';

type ShiftHours = Pick<TrainerWorkShift, 'startTime' | 'endTime'>;

const DEFAULT_SHIFT_HOURS: ShiftHours = { startTime: '08:00', endTime: '12:00' };

const byWeekday = (a: TrainerWorkShift, b: TrainerWorkShift): number =>
  a.weekday - b.weekday;

const firstShift = (shifts: TrainerWorkShift[]): TrainerWorkShift | undefined =>
  [...shifts].sort(byWeekday)[0];

export const findShift = (
  shifts: TrainerWorkShift[],
  weekday: number,
): TrainerWorkShift | undefined =>
  shifts.find((shift) => shift.weekday === weekday);

/**
 * Ticks or unticks a weekday. A newly ticked day copies the hours of the
 * first ticked one, since a trainer usually repeats the same shift.
 */
export function toggleShiftDay(
  shifts: TrainerWorkShift[],
  weekday: number,
): TrainerWorkShift[] {
  if (findShift(shifts, weekday)) {
    return shifts.filter((shift) => shift.weekday !== weekday);
  }
  const { startTime, endTime } = firstShift(shifts) ?? DEFAULT_SHIFT_HOURS;
  return [...shifts, { weekday, startTime, endTime }].sort(byWeekday);
}

export function updateShiftHours(
  shifts: TrainerWorkShift[],
  weekday: number,
  patch: Partial<ShiftHours>,
): TrainerWorkShift[] {
  return shifts.map((shift) =>
    shift.weekday === weekday ? { ...shift, ...patch } : shift,
  );
}

export function copyFirstShiftToAll(
  shifts: TrainerWorkShift[],
): TrainerWorkShift[] {
  const first = firstShift(shifts);
  if (!first) return shifts;
  return shifts.map((shift) => ({
    ...shift,
    startTime: first.startTime,
    endTime: first.endTime,
  }));
}
