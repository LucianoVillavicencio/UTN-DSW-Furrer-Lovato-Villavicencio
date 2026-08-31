import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Whether `supplied` is the owner password.
 *
 * Compared through SHA-256 digests for two reasons: timingSafeEqual requires
 * equal-length buffers, and digesting first means the comparison time does not
 * depend on how many leading characters of the real password a guess got
 * right. A plain === would leak both the length and the common prefix.
 */
export function matchesOwnerPassword(
  supplied: string,
  expected: string,
): boolean {
  const a = createHash('sha256').update(supplied, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}
