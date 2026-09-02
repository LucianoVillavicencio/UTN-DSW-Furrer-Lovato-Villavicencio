import type { SavedCard } from '../../types/savedCard';

// 'visa' -> 'Visa'. MP's payment method ids are already lowercase single
// words (visa, master, amex), so a lookup table per issuer is not needed.
export function formatCardLabel(
  card: Pick<SavedCard, 'paymentMethodId' | 'lastFourDigits'>,
): string {
  const { paymentMethodId, lastFourDigits } = card;
  const capitalized =
    paymentMethodId.charAt(0).toUpperCase() + paymentMethodId.slice(1);
  return `${capitalized} •••• ${lastFourDigits}`;
}

/**
 * Spanish warning shown when a saved card expires within 60 days of `today`
 * (inclusive), else null.
 *
 * Reuses the "first of next month" boundary from the backend's isChargeable
 * (savedCard.rules.ts): expirationMonth is 1-indexed, and the Date
 * constructor's month argument is 0-indexed, so passing expirationMonth
 * unadjusted already lands on the first day of the month AFTER expiry. That
 * boundary is compared against `today` plus 60 days — a card at or past the
 * boundary is also "within 60 days" here, since this is a heads-up, not the
 * chargeability check (isChargeable is not ported to the frontend).
 */
export function cardExpiryWarning(
  card: Pick<SavedCard, 'expirationMonth' | 'expirationYear'>,
  today: Date,
): string | null {
  const boundary = new Date(card.expirationYear, card.expirationMonth, 1);
  const todayPlus60 = new Date(today);
  todayPlus60.setDate(todayPlus60.getDate() + 60);

  if (boundary.getTime() > todayPlus60.getTime()) {
    return null;
  }

  return 'Tu tarjeta vence pronto. Actualizala para no perder la renovación automática.';
}
