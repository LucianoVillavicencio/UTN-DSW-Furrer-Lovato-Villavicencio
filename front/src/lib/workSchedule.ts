import { formatTimeOfDay, weekdayShort } from './weekday';

import type { TrainerWorkShift } from '../types/trainer';

// "Lun a Vie · 08:00 – 12:00". Consecutive weekdays sharing the same hours
// collapse into one line, so a full week reads as a single row instead of six.
export const formatWorkSchedule = (
  shifts?: TrainerWorkShift[] | null,
): string[] => {
  if (!shifts || shifts.length === 0) {
    return [];
  }

  const sorted = [...shifts].sort((a, b) => a.weekday - b.weekday);
  const runs: TrainerWorkShift[][] = [];

  for (const shift of sorted) {
    const currentRun = runs[runs.length - 1];
    const previous = currentRun?.[currentRun.length - 1];
    const continuesRun =
      previous !== undefined &&
      previous.weekday === shift.weekday - 1 &&
      previous.startTime === shift.startTime &&
      previous.endTime === shift.endTime;

    if (continuesRun) {
      currentRun.push(shift);
    } else {
      runs.push([shift]);
    }
  }

  return runs.map((run) => {
    const first = run[0];
    const last = run[run.length - 1];
    const days =
      run.length === 1
        ? weekdayShort(first.weekday)
        : run.length === 2
          ? `${weekdayShort(first.weekday)} y ${weekdayShort(last.weekday)}`
          : `${weekdayShort(first.weekday)} a ${weekdayShort(last.weekday)}`;

    return `${days} · ${formatTimeOfDay(first.startTime)} – ${formatTimeOfDay(first.endTime)}`;
  });
};
