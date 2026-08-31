import { isChargeable } from './savedCard.rules';

describe('isChargeable', () => {
  const card = {
    active: true,
    deleted: false,
    expirationMonth: 12,
    expirationYear: 2030,
  };

  it('accepts an active, current card', () => {
    expect(isChargeable(card, new Date(2026, 7, 26))).toBe(true);
  });

  it('rejects a deactivated or deleted card', () => {
    expect(
      isChargeable({ ...card, active: false }, new Date(2026, 7, 26)),
    ).toBe(false);
    expect(
      isChargeable({ ...card, deleted: true }, new Date(2026, 7, 26)),
    ).toBe(false);
  });

  it('accepts a card through the last day of its expiry month', () => {
    // A card expiring 08/2026 is good for all of August. Rejecting it on the
    // 1st would decline a perfectly valid card for a month.
    const august = { ...card, expirationMonth: 8, expirationYear: 2026 };
    expect(isChargeable(august, new Date(2026, 7, 31))).toBe(true);
    expect(isChargeable(august, new Date(2026, 8, 1))).toBe(false);
  });
});
