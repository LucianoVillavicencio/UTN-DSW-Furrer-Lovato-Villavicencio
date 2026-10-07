import { describe, expect, it } from 'vitest';
import {
  PRESET_TIMES,
  addCustomTime,
  emptyClassSessionForm,
  timeChips,
  toggleTime,
} from './class-session-form';

describe('emptyClassSessionForm', () => {
  it('starts with no hour picked', () => {
    expect(emptyClassSessionForm.times).toEqual([]);
  });
});

describe('timeChips', () => {
  it('lists the hourly presets from 07:00 to 21:00', () => {
    expect(timeChips([])).toEqual(PRESET_TIMES);
    expect(PRESET_TIMES[0]).toBe('07:00');
    expect(PRESET_TIMES[PRESET_TIMES.length - 1]).toBe('21:00');
    expect(PRESET_TIMES).toHaveLength(15);
  });

  it('merges an off-the-hour pick into its chronological place', () => {
    const chips = timeChips(['18:30']);
    expect(chips.indexOf('18:30')).toBe(chips.indexOf('18:00') + 1);
  });

  it('does not duplicate a picked preset', () => {
    expect(timeChips(['08:00'])).toEqual(PRESET_TIMES);
  });
});

describe('toggleTime', () => {
  it('adds a time in chronological order', () => {
    expect(toggleTime(['19:00'], '08:00', false)).toEqual(['08:00', '19:00']);
  });

  it('removes a picked time', () => {
    expect(toggleTime(['08:00', '19:00'], '08:00', false)).toEqual(['19:00']);
  });

  it('replaces the time when editing a single slot', () => {
    expect(toggleTime(['08:00'], '10:00', true)).toEqual(['10:00']);
  });
});

describe('addCustomTime', () => {
  it('adds a new time in chronological order', () => {
    expect(addCustomTime(['19:00'], '18:30', false)).toEqual([
      '18:30',
      '19:00',
    ]);
  });

  it('ignores a time that is already picked', () => {
    expect(addCustomTime(['18:30'], '18:30', false)).toEqual(['18:30']);
  });

  it('ignores an empty or malformed value', () => {
    expect(addCustomTime(['08:00'], '', false)).toEqual(['08:00']);
    expect(addCustomTime(['08:00'], '8', false)).toEqual(['08:00']);
  });

  it('replaces the time when editing a single slot', () => {
    expect(addCustomTime(['08:00'], '18:30', true)).toEqual(['18:30']);
  });
});
