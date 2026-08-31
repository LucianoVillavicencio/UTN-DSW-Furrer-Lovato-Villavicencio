import { describe, expect, it } from 'vitest';
import {
  availableMonths,
  findDurationFormError,
  toDurationPayload,
} from './plan-durations';
import type { PlanDuration } from '../../types/plan';

const row = (months: 3 | 6 | 12): PlanDuration =>
  ({ id: months, planId: 1, months, numDays: months * 30, price: 100 });

// Hoisted to module scope so both `describe('findDurationFormError', ...)`
// and `describe('toDurationPayload', ...)` can reference it.
const valid = { months: 6 as const, numDaysText: '180', priceText: '19.995' };

describe('availableMonths', () => {
  it('offers every duration when the plan has none', () => {
    expect(availableMonths([])).toEqual([3, 6, 12]);
  });

  it('excludes the ones already priced', () => {
    expect(availableMonths([row(6)])).toEqual([3, 12]);
  });

  it('returns an empty list when all three are taken', () => {
    expect(availableMonths([row(3), row(6), row(12)])).toEqual([]);
  });
});

describe('findDurationFormError', () => {
  it('accepts a well-formed row', () => {
    expect(findDurationFormError(valid, [])).toBeNull();
  });

  it('rejects a month count already priced on this plan', () => {
    expect(findDurationFormError(valid, [row(6)])).toMatch(/6 meses/);
  });

  it('rejects a fractional day count', () => {
    expect(findDurationFormError({ ...valid, numDaysText: '180.5' }, [])).toMatch(/entero/);
  });

  it('rejects a non-positive price', () => {
    expect(findDurationFormError({ ...valid, priceText: '0' }, [])).toMatch(/mayor a cero/);
  });

  it('rejects an unparseable price', () => {
    expect(findDurationFormError({ ...valid, priceText: 'gratis' }, [])).toMatch(/precio/i);
  });
});

describe('toDurationPayload', () => {
  it('reads the Argentine thousands dot as a thousands separator', () => {
    expect(toDurationPayload(valid)).toEqual({ months: 6, numDays: 180, price: 19995 });
  });
});
