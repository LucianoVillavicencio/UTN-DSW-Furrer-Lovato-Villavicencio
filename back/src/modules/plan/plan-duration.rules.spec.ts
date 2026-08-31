import { NotFoundException } from '@nestjs/common';
import { Plan } from './entity/plan.entity';
import { PlanDuration } from './entity/plan-duration.entity';
import { resolveTerm } from './plan-duration.rules';

const plan = { id: 2, name: 'Premium', price: 59, numDays: 30 } as Plan;

const duration = (over: Partial<PlanDuration>): PlanDuration =>
  ({
    id: 1,
    planId: 2,
    months: 6,
    numDays: 180,
    price: 300,
    deleted: false,
    ...over,
  }) as PlanDuration;

describe('resolveTerm', () => {
  it('reads the plan itself for one month', () => {
    expect(resolveTerm(plan, 1, [])).toEqual({
      months: 1,
      numDays: 30,
      price: 59,
      planDurationId: null,
    });
  });

  it('reads the matching duration for six months', () => {
    expect(resolveTerm(plan, 6, [duration({ id: 7 })])).toEqual({
      months: 6,
      numDays: 180,
      price: 300,
      planDurationId: 7,
    });
  });

  it('refuses a duration the plan does not offer', () => {
    expect(() => resolveTerm(plan, 12, [duration({})])).toThrow(
      NotFoundException,
    );
  });

  it('does not match a deleted duration', () => {
    expect(() => resolveTerm(plan, 6, [duration({ deleted: true })])).toThrow(
      NotFoundException,
    );
  });

  it('never satisfies one month from a duration row', () => {
    // months:1 rows must not exist, but if one were written by hand it must
    // not become a second source of truth for the plan's own price.
    const rogue = duration({ months: 1, numDays: 45, price: 10 });
    expect(resolveTerm(plan, 1, [rogue]).price).toBe(59);
  });

  it('refuses a months value that is not 1, 3, 6 or 12', () => {
    expect(() => resolveTerm(plan, 4, [])).toThrow(NotFoundException);
  });

  it('coerces a DECIMAL price that arrived from mysql2 as a string', () => {
    const stringPriced = { ...plan, price: '59.00' } as unknown as Plan;
    expect(resolveTerm(stringPriced, 1, []).price).toBe(59);
  });
});
