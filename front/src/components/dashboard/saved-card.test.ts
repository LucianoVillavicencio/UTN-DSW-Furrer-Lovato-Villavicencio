import { describe, expect, it } from 'vitest';
import { cardExpiryWarning, formatCardLabel, termSavings } from './saved-card';

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

describe('termSavings', () => {
  it('returns the savings when the term is cheaper than paying monthly', () => {
    // 6 months at $1000/month = $6000; the term costs $5000 -> saves $1000.
    expect(termSavings({ months: 6, price: 5000 }, 1000)).toBe(
      'Ahorrás $1.000',
    );
  });

  it('handles string DECIMAL values from MySQL', () => {
    expect(termSavings({ months: 6, price: '5000.00' }, '1000.00')).toBe(
      'Ahorrás $1.000',
    );
  });

  it('returns null when the term costs the same as paying monthly', () => {
    expect(termSavings({ months: 3, price: 3000 }, 1000)).toBeNull();
  });

  it('returns null when the term is more expensive than paying monthly', () => {
    expect(termSavings({ months: 3, price: 4000 }, 1000)).toBeNull();
  });
});
