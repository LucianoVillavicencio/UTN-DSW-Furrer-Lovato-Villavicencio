import { daysOwedBack, exceedsPauseCap, MAX_PAUSE_DAYS } from './pause.rules';

describe('daysOwedBack', () => {
  it('owes nothing for a pause and unpause on the same day', () => {
    expect(daysOwedBack('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('owes one day after one day', () => {
    expect(daysOwedBack('2026-03-01', '2026-03-02')).toBe(1);
  });

  it('counts across a month boundary', () => {
    expect(daysOwedBack('2026-01-20', '2026-02-05')).toBe(16);
  });

  it('counts across a leap day', () => {
    expect(daysOwedBack('2028-02-27', '2028-03-01')).toBe(3);
  });

  it('never returns a negative number', () => {
    // A clock skew or a hand-edited row must not shorten the membership.
    expect(daysOwedBack('2026-03-10', '2026-03-01')).toBe(0);
  });
});

describe('exceedsPauseCap', () => {
  it('is false inside the cap', () => {
    expect(exceedsPauseCap('2026-01-01', '2026-03-01')).toBe(false);
  });

  it('is true past the cap', () => {
    expect(exceedsPauseCap('2026-01-01', '2026-06-01')).toBe(true);
  });

  it('reports the cap it used', () => {
    expect(MAX_PAUSE_DAYS).toBe(90);
  });
});
