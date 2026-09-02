import { describe, expect, it } from 'vitest';
import {
  durationOptionsFor,
  findChargeFormError,
  isOrderMethod,
  resolvedPriceFor,
} from './plan-charge';
import type { Plan, PlanDuration } from '../../types/plan';

const plan: Plan = { id: 2, name: 'Premium', price: 59, numDays: 30 };
const sixMonths: PlanDuration = { id: 7, planId: 2, months: 6, numDays: 180, price: 300 };

describe('durationOptionsFor', () => {
  it('always offers one month, even with no durations', () => {
    expect(durationOptionsFor(plan, [])).toEqual([{ months: 1, label: '1 mes' }]);
  });

  it('offers only the durations the plan actually has', () => {
    expect(durationOptionsFor(plan, [sixMonths]).map((o) => o.months)).toEqual([1, 6]);
  });

  it('offers nothing when no plan is selected', () => {
    expect(durationOptionsFor(null, [sixMonths])).toEqual([]);
  });
});

describe('resolvedPriceFor', () => {
  it('reads the plan price for one month', () => {
    expect(resolvedPriceFor(plan, [], 1)).toBe(59);
  });

  it('reads the duration price for six months', () => {
    expect(resolvedPriceFor(plan, [sixMonths], 6)).toBe(300);
  });

  it('coerces a DECIMAL price that arrived as a string', () => {
    const stringPriced = { ...plan, price: '59.00' } as unknown as Plan;
    expect(resolvedPriceFor(stringPriced, [], 1)).toBe(59);
  });

  it('returns null when the plan does not offer that duration', () => {
    expect(resolvedPriceFor(plan, [], 6)).toBeNull();
  });
});

describe('findChargeFormError', () => {
  it('accepts a complete form', () => {
    expect(
      findChargeFormError({ planId: 2, months: 1, amountText: '19.995' }),
    ).toBeNull();
  });

  it('rejects a missing plan', () => {
    expect(findChargeFormError({ planId: '', months: 1, amountText: '100' })).toMatch(
      /plan/i,
    );
  });

  it('rejects a zero amount', () => {
    expect(findChargeFormError({ planId: 2, months: 1, amountText: '0' })).toMatch(
      /monto/i,
    );
  });

  it('rejects an unparseable amount', () => {
    expect(findChargeFormError({ planId: 2, months: 1, amountText: 'nada' })).toMatch(
      /monto/i,
    );
  });
});

describe('isOrderMethod', () => {
  it('routes point and qr through a charge order', () => {
    expect(isOrderMethod('point')).toBe(true);
    expect(isOrderMethod('qr')).toBe(true);
  });

  it('routes the cash family through plan checkout', () => {
    expect(isOrderMethod('efectivo')).toBe(false);
    expect(isOrderMethod('debito')).toBe(false);
    expect(isOrderMethod('credito')).toBe(false);
    expect(isOrderMethod('transferencia')).toBe(false);
  });
});
