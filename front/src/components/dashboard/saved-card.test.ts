import { describe, expect, it } from 'vitest';
import { cardExpiryWarning, formatCardLabel } from './saved-card';

describe('formatCardLabel', () => {
  it('capitalizes the payment method id and shows the last four digits', () => {
    expect(
      formatCardLabel({ paymentMethodId: 'visa', lastFourDigits: '4242' }),
    ).toBe('Visa •••• 4242');
  });

  it('capitalizes only the first letter, leaving the rest as-is', () => {
    expect(
      formatCardLabel({ paymentMethodId: 'master', lastFourDigits: '0000' }),
    ).toBe('Master •••• 0000');
  });
});

describe('cardExpiryWarning', () => {
  // A card expiring 01/2026 is chargeable through Jan 31, 2026 — the same
  // boundary the backend's isChargeable uses: new Date(2026, 1, 1) (Feb 1,
  // the first day AFTER the expiry month, month arg 0-indexed).
  const card = { expirationMonth: 1, expirationYear: 2026 };

  it('returns null when the card expires more than 60 days out', () => {
    // Boundary (Feb 1, 2026) minus 61 days = Dec 2, 2025.
    const today = new Date(2025, 11, 2);
    expect(cardExpiryWarning(card, today)).toBeNull();
  });

  it('warns exactly at the 60-day boundary', () => {
    // Boundary minus 60 days = Dec 3, 2025.
    const today = new Date(2025, 11, 3);
    expect(cardExpiryWarning(card, today)).not.toBeNull();
  });

  it('warns 1 day before expiry', () => {
    // Boundary minus 1 day = Jan 31, 2026.
    const today = new Date(2026, 0, 31);
    expect(cardExpiryWarning(card, today)).not.toBeNull();
  });

  it('still warns the day after the card has expired', () => {
    // The boundary itself (Feb 1, 2026): isChargeable would call this card
    // expired, but the warning is not the chargeability check.
    const today = new Date(2026, 1, 1);
    expect(cardExpiryWarning(card, today)).not.toBeNull();
  });
});
