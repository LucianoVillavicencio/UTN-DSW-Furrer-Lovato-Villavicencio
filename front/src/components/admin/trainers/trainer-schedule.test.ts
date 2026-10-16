import { describe, expect, it } from 'vitest';
import {
  copyFirstShiftToAll,
  findShift,
  toggleShiftDay,
  updateShiftHours,
} from './trainer-schedule';

import type { TrainerWorkShift } from '../../../types/trainer';

const monday: TrainerWorkShift = {
  weekday: 1,
  startTime: '08:00',
  endTime: '12:00',
};
const wednesday: TrainerWorkShift = {
  weekday: 3,
  startTime: '14:00',
  endTime: '20:00',
};

describe('findShift', () => {
  it('finds the shift of a weekday', () => {
    expect(findShift([monday, wednesday], 3)).toBe(wednesday);
  });

  it('returns undefined for a day off', () => {
    expect(findShift([monday], 2)).toBeUndefined();
  });
});

describe('toggleShiftDay', () => {
  it('ticks the first day with the default 08:00-12:00 shift', () => {
    expect(toggleShiftDay([], 2)).toEqual([
      { weekday: 2, startTime: '08:00', endTime: '12:00' },
    ]);
  });

  it('copies the first ticked day hours onto a new day, sorted by weekday', () => {
    expect(toggleShiftDay([wednesday], 1)).toEqual([
      { weekday: 1, startTime: '14:00', endTime: '20:00' },
      wednesday,
    ]);
  });

  it('unticks a day', () => {
    expect(toggleShiftDay([monday, wednesday], 1)).toEqual([wednesday]);
  });
});

describe('updateShiftHours', () => {
  it('changes only the given day', () => {
    expect(
      updateShiftHours([monday, wednesday], 1, { endTime: '13:00' }),
    ).toEqual([{ ...monday, endTime: '13:00' }, wednesday]);
  });
});

describe('copyFirstShiftToAll', () => {
  it('copies the earliest weekday hours onto every ticked day', () => {
    expect(copyFirstShiftToAll([wednesday, monday])).toEqual([
      { weekday: 3, startTime: '08:00', endTime: '12:00' },
      monday,
    ]);
  });

  it('leaves an empty schedule alone', () => {
    expect(copyFirstShiftToAll([])).toEqual([]);
  });
});
