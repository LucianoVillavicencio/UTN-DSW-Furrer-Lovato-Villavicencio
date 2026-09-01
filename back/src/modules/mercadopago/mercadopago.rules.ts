import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Maximum age, in milliseconds, that a webhook notification's `ts` may have
 * relative to "now" before it is rejected as a replay. Mercado Pago's own
 * guidance is a five minute window.
 */
export const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

export interface SignatureManifestParts {
  dataId?: string;
  requestId?: string;
  ts?: string;
}

export interface ParsedSignatureHeader {
  ts: string;
  v1: string;
}

export interface VerifyWebhookSignatureInput {
  signatureHeader: string;
  requestId: string;
  dataId: string;
}

/**
 * Builds the manifest string Mercado Pago signs, in the documented
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` template.
 *
 * Field order is always id, request-id, ts. A component that is absent is
 * skipped entirely rather than emitted as an empty segment, since an empty
 * segment would produce a manifest MP never actually signed. `dataId` is
 * lowercased unconditionally: numeric ids are unaffected, but alphanumeric
 * order ids (Point, QR) arrive uppercase and MP hashes them lowercased.
 */
export function buildSignatureManifest(parts: SignatureManifestParts): string {
  const segments: string[] = [];

  if (parts.dataId !== undefined) {
    segments.push(`id:${parts.dataId.toLowerCase()}`);
  }
  if (parts.requestId !== undefined) {
    segments.push(`request-id:${parts.requestId}`);
  }
  if (parts.ts !== undefined) {
    segments.push(`ts:${parts.ts}`);
  }

  return segments.length === 0 ? '' : `${segments.join(';')};`;
}

/**
 * Parses Mercado Pago's `x-signature` header, e.g.
 * `ts=1742505638683,v1=ced36ab6d33566bb...`, into its `ts` and `v1` parts.
 * Returns null for anything that doesn't contain both — callers must treat
 * that as "reject", never throw.
 */
export function parseSignatureHeader(
  header: string,
): ParsedSignatureHeader | null {
  if (!header) return null;

  let ts: string | undefined;
  let v1: string | undefined;

  for (const rawPart of header.split(',')) {
    const part = rawPart.trim();
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;

    const key = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();

    if (key === 'ts') ts = value;
    else if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) return null;

  return { ts, v1 };
}

/**
 * Verifies a Mercado Pago webhook notification's signature.
 *
 * Parses the `x-signature` header, rejects anything unparseable or replayed
 * outside the SIGNATURE_TOLERANCE_MS window, then recomputes the expected
 * HMAC-SHA256 over the manifest and compares it against the provided one.
 *
 * The comparison uses `crypto.timingSafeEqual` rather than `===` (or
 * string/Buffer .equals) because a naive comparison short-circuits on the
 * first differing byte. That turns comparison time into an oracle: an
 * attacker who can measure response latency can recover the valid signature
 * one byte at a time. `timingSafeEqual` always compares the full length,
 * so wrong-signature latency carries no information about how many bytes
 * matched.
 *
 * `timingSafeEqual` itself throws if the two buffers differ in length, so
 * that mismatch is checked explicitly and treated as an ordinary "invalid
 * signature" (return false) rather than allowed to throw — an attacker
 * sending a wrong-length signature must get the same result, on the same
 * code path, as any other bad signature, not an exception that behaves
 * differently or crashes the handler.
 */
export function verifyWebhookSignature(
  input: VerifyWebhookSignatureInput,
  secret: string,
  now: Date,
): boolean {
  const parsed = parseSignatureHeader(input.signatureHeader);
  if (!parsed) return false;

  const rawTs = Number(parsed.ts);
  if (!Number.isFinite(rawTs)) return false;

  // Mercado Pago's own docs describe `ts` as milliseconds, but real Point
  // `order`-topic deliveries were confirmed (by capturing live traffic) to
  // send it as Unix SECONDS on some notifications/retries and milliseconds
  // on others, for the same underlying event — an undocumented
  // inconsistency, not a bug in a specific delivery. `now.getTime()` is
  // always milliseconds, so a seconds-based `ts` compared directly reads as
  // ~1970 and fails the freshness check by decades, silently rejecting a
  // genuinely fresh, correctly-signed notification. A value below this
  // threshold cannot be a plausible millisecond timestamp for any date
  // after 2001, so it must be seconds and needs scaling first. The
  // manifest below still hashes `parsed.ts` verbatim — MP signs whatever
  // string it actually sent, so only this freshness check needs the
  // normalized value.
  const MIN_PLAUSIBLE_MS_TIMESTAMP = 1_000_000_000_000; // 2001-09-09
  const tsMs = rawTs < MIN_PLAUSIBLE_MS_TIMESTAMP ? rawTs * 1000 : rawTs;

  const age = Math.abs(now.getTime() - tsMs);
  if (age > SIGNATURE_TOLERANCE_MS) return false;

  const manifest = buildSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    ts: parsed.ts,
  });

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(parsed.v1, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
