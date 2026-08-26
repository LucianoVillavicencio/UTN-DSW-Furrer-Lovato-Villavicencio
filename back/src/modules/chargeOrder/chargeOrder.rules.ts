// Five-minute order expiration, in ISO 8601 duration form for Mercado Pago's API.
// Must stay in sync with ORDER_EXPIRATION_MS: the panel computes a local expiresAt
// timestamp from ORDER_EXPIRATION_MS, and Mercado Pago itself uses ORDER_EXPIRATION.
// A mismatch means the panel and MP disagree about whether a charge is still live —
// critical in a shared printed QR scenario where a stale order could double-book
// the code or leave it locked past when it should free up.
export const ORDER_EXPIRATION = 'PT5M';

// Five minutes in milliseconds. Must stay in sync with ORDER_EXPIRATION:
// see comment above.
export const ORDER_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Builds the external_reference string for a Mercado Pago charge order.
 *
 * Mercado Pago's constraint on this field is strict:
 * - Maximum 64 characters
 * - Only letters (upper/lower), digits, hyphen and underscore
 * - Must not carry personally identifying information (no names, DNIs, emails)
 * - Must be unique per order
 *
 * Keying the reference on the subscription id (not the member) keeps PII out of
 * a third party's system entirely.
 *
 * @param subscriptionId - The subscription ID (number)
 * @param random - Random string component for uniqueness (string)
 * @returns The formatted external reference string
 */
export function buildExternalReference(subscriptionId: number, random: string): string {
  return `flg-sub-${subscriptionId}-${random}`;
}

/**
 * Checks whether a charge order has expired.
 *
 * An order is considered expired at or after its expiresAt time (inclusive).
 * An order expiring exactly at the check time should read as expired, not
 * still-valid for one more instant.
 *
 * @param order - Object with an expiresAt field (Date)
 * @param now - The current time to check against (Date)
 * @returns true if now >= expiresAt, false otherwise
 */
export function isExpired(
  order: { expiresAt: Date },
  now: Date,
): boolean {
  return now.getTime() >= order.expiresAt.getTime();
}
