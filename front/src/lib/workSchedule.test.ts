import { describe, expect, it } from 'vitest';
import { formatWorkSchedule } from './workSchedule';

describe('formatWorkSchedule', () => {
  it('returns nothing for an empty or missing schedule', () => {
    expect(formatWorkSchedule([])).toEqual([]);
    expect(formatWorkSchedule(null)).toEqual([]);
    expect(formatWorkSchedule(undefined)).toEqual([]);
  });

  it('renders a single day', () => {
    expect(
      formatWorkSchedule([
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
      ]),
    ).toEqual(['Lun · 08:00 – 12:00']);
  });

  it('joins exactly two consecutive days with "y"', () => {
    expect(
      formatWorkSchedule([
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
      ]),
    ).toEqual(['Lun y Mar · 08:00 – 12:00']);
  });

  it('collapses a run of three or more consecutive days with "a"', () => {
    expect(
      formatWorkSchedule([
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
        { weekday: 3, startTime: '08:00', endTime: '12:00' },
        { weekday: 4, startTime: '08:00', endTime: '12:00' },
        { weekday: 5, startTime: '08:00', endTime: '12:00' },
      ]),
    ).toEqual(['Lun a Vie · 08:00 – 12:00']);
  });

  it('breaks the run when the hours change', () => {
    expect(
      formatWorkSchedule([
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
        { weekday: 3, startTime: '14:00', endTime: '18:00' },
      ]),
    ).toEqual(['Lun y Mar · 08:00 – 12:00', 'Mié · 14:00 – 18:00']);
  });

  it('breaks the run on a gap in the week', () => {
    expect(
      formatWorkSchedule([
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 3, startTime: '08:00', endTime: '12:00' },
      ]),
    ).toEqual(['Lun · 08:00 – 12:00', 'Mié · 08:00 – 12:00']);
  });

  it('sorts an out-of-order schedule before grouping', () => {
    expect(
      formatWorkSchedule([
        { weekday: 3, startTime: '08:00', endTime: '12:00' },
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
      ]),
    ).toEqual(['Lun a Mié · 08:00 – 12:00']);
  });

  it('trims the seconds a MySQL time column sends back', () => {
    expect(
      formatWorkSchedule([
        { weekday: 6, startTime: '09:00:00', endTime: '13:00:00' },
      ]),
    ).toEqual(['Sáb · 09:00 – 13:00']);
  });
});
