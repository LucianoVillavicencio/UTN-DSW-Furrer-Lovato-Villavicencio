import { describe, expect, it } from 'vitest';
import { periodLabel, shareOf } from './analytics-format';

describe('periodLabel', () => {
  it('renders a month as a short Spanish month and year', () => {
    expect(periodLabel('2026-08')).toBe('ago 2026');
  });

  it('renders a day as day and short month', () => {
    expect(periodLabel('2026-08-30')).toBe('30 ago');
  });

  it('passes anything unrecognised through unchanged', () => {
    expect(periodLabel('rarest')).toBe('rarest');
  });
});

describe('shareOf', () => {
  it('is a percentage of the total', () => {
    expect(shareOf(25, 100)).toBe(25);
  });

  it('is zero when the total is zero, not NaN', () => {
    expect(shareOf(0, 0)).toBe(0);
  });

  it('never exceeds 100', () => {
    expect(shareOf(150, 100)).toBe(100);
  });
});
