import { monthsUsed, refundAmount } from './refund.rules';

describe('monthsUsed', () => {
  // A started month counts as used — see "Policy constants to confirm".
  it('counts nothing on the day of purchase', () => {
    // Same-day cancellation is a full refund. Charging a month for zero days
    // of access would be indefensible at the counter.
    expect(monthsUsed('2026-01-01', '2026-01-01', 30)).toBe(0);
  });

  it('counts one month from the very first day used', () => {
    expect(monthsUsed('2026-01-01', '2026-01-02', 30)).toBe(1);
  });

  it('still counts one on the last day of the first month', () => {
    expect(monthsUsed('2026-01-01', '2026-01-31', 30)).toBe(1);
  });

  it('rolls to two the day the second month starts', () => {
    expect(monthsUsed('2026-01-01', '2026-02-01', 30)).toBe(2);
  });

  it('uses the plan period, not the calendar month', () => {
    // A 45-day plan's "month" is 45 days. Hard-coding 30 here would overcharge
    // every member on a non-monthly plan.
    expect(monthsUsed('2026-01-01', '2026-02-10', 45)).toBe(1);
    expect(monthsUsed('2026-01-01', '2026-02-16', 45)).toBe(2);
  });
});

describe('refundAmount', () => {
  const regular = 10000;

  it('returns everything when nothing was used', () => {
    expect(refundAmount({ totalPaid: 100000, monthsUsed: 0, regularMonthlyPrice: regular })).toBe(100000);
  });

  it('charges consumed months at the regular rate, revoking the discount', () => {
    // A year bought for 100000 (regular would be 120000), cancelled after 3
    // months: 100000 - 3*10000 = 70000. The discount is not honoured on the
    // months consumed, which is the whole point of the policy.
    expect(refundAmount({ totalPaid: 100000, monthsUsed: 3, regularMonthlyPrice: regular })).toBe(70000);
  });

  it('clamps to zero rather than going negative', () => {
    // Reachable, not defensive: a deeply discounted year cancelled at month 11
    // consumed more at the regular rate than was ever paid. The gym does not
    // then invoice the member for the difference.
    expect(refundAmount({ totalPaid: 100000, monthsUsed: 11, regularMonthlyPrice: regular })).toBe(0);
  });

  it('returns exactly zero at the break-even point', () => {
    expect(refundAmount({ totalPaid: 100000, monthsUsed: 10, regularMonthlyPrice: regular })).toBe(0);
  });

  it('rounds to two decimals', () => {
    // The column is decimal(10,2) and the MP refund API takes a currency
    // amount, so a third decimal must never reach either.
    //
    // Deliberately NOT tested at a .005 knife-edge: in binary floating point
    // 100.005 * 100 is 10012.499..., so any round-half-up implementation
    // returns 100.00 and a test asserting 100.01 would fail against correct
    // code. Half-cent behaviour is not a rule this feature needs to pin down.
    expect(refundAmount({ totalPaid: 100.126, monthsUsed: 0, regularMonthlyPrice: regular })).toBe(100.13);
    expect(refundAmount({ totalPaid: 100.124, monthsUsed: 0, regularMonthlyPrice: regular })).toBe(100.12);
  });
});
