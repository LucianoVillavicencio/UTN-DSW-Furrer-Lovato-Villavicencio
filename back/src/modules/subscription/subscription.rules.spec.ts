import {
  dayAfter,
  isCurrentOn,
  subscriptionPeriod,
  toDateOnly,
} from './subscription.rules';

describe('toDateOnly', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateOnly(new Date(2026, 7, 25))).toBe('2026-08-25');
  });

  it('pads a single-digit month and day', () => {
    expect(toDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local date parts, not UTC', () => {
    // Late enough in the day that a UTC-based implementation would report
    // tomorrow for anyone east of Greenwich, and yesterday for anyone west.
    // This is the regression the helper exists to prevent: a MySQL 'date'
    // column must not shift by a day on its way in.
    expect(toDateOnly(new Date(2026, 7, 25, 23, 30))).toBe('2026-08-25');
    expect(toDateOnly(new Date(2026, 7, 25, 0, 30))).toBe('2026-08-25');
  });
});

describe('subscriptionPeriod', () => {
  it('ends numDays after the start', () => {
    const period = subscriptionPeriod(30, new Date(2026, 7, 25));
    expect(String(period.startDate)).toBe('2026-08-25');
    expect(String(period.endDate)).toBe('2026-09-24');
  });

  it('crosses a year boundary', () => {
    const period = subscriptionPeriod(10, new Date(2026, 11, 28));
    expect(String(period.endDate)).toBe('2027-01-07');
  });
});

describe('isCurrentOn', () => {
  it('is current the day before it ends', () => {
    expect(isCurrentOn('2026-08-26', '2026-08-25')).toBe(true);
  });

  // The boundary. A 30-day plan bought on day 0 ends on day 30, and the member
  // paid for day 30 itself, so access holds through it and lapses on day 31.
  it('is current on the day it ends', () => {
    expect(isCurrentOn('2026-08-25', '2026-08-25')).toBe(true);
  });

  it('is not current the day after it ends', () => {
    expect(isCurrentOn('2026-08-24', '2026-08-25')).toBe(false);
  });

  it('is not current long after it ends', () => {
    expect(isCurrentOn('2026-01-01', '2026-08-25')).toBe(false);
  });

  // TypeORM returns a MySQL 'date' column as a string, but the entity types it
  // as Date and subscriptionPeriod writes strings cast to Date. Accept both so
  // the predicate cannot be defeated by which side of the driver it is called
  // on.
  it('accepts a Date as well as a string', () => {
    expect(isCurrentOn(new Date(2026, 7, 25), '2026-08-25')).toBe(true);
    expect(isCurrentOn(new Date(2026, 7, 24), '2026-08-25')).toBe(false);
  });

  it('ignores a time component on an ISO timestamp', () => {
    expect(isCurrentOn('2026-08-25T00:00:00.000Z', '2026-08-25')).toBe(true);
  });
});

describe('dayAfter', () => {
  it('returns the calendar day after the given date-only string', () => {
    expect(toDateOnly(dayAfter('2026-08-30'))).toBe('2026-08-31');
  });

  it('crosses a month boundary correctly', () => {
    expect(toDateOnly(dayAfter('2026-08-31'))).toBe('2026-09-01');
  });
});
