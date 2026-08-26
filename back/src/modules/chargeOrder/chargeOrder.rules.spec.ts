import {
  buildExternalReference,
  isExpired,
  ORDER_EXPIRATION,
  ORDER_EXPIRATION_MS,
} from './chargeOrder.rules';

describe('buildExternalReference', () => {
  it('produces the documented shape', () => {
    expect(buildExternalReference(123, 'a1b2c3d4')).toBe('flg-sub-123-a1b2c3d4');
  });

  it("stays within Mercado Pago's 64-character limit", () => {
    expect(buildExternalReference(999999999, 'a1b2c3d4').length).toBeLessThanOrEqual(64);
  });

  it('uses only characters Mercado Pago accepts', () => {
    // MP allows letters, digits, hyphen and underscore. Anything else is
    // rejected at order creation.
    expect(buildExternalReference(1, 'a1b2c3d4')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('references the subscription, never the member', () => {
    // MP documents that this field must not carry PII. Keying it on the
    // subscription id keeps names, DNIs and emails out of a third party's
    // system entirely.
    const ref = buildExternalReference(123, 'a1b2c3d4');
    expect(ref).not.toMatch(/@/);
    expect(ref).toContain('sub');
  });
});

describe('isExpired', () => {
  const at = (iso: string) => new Date(iso);

  it('is false before expiresAt', () => {
    expect(isExpired({ expiresAt: at('2026-08-26T10:05:00Z') }, at('2026-08-26T10:04:59Z'))).toBe(false);
  });

  it('is true at and after expiresAt', () => {
    expect(isExpired({ expiresAt: at('2026-08-26T10:05:00Z') }, at('2026-08-26T10:05:00Z'))).toBe(true);
    expect(isExpired({ expiresAt: at('2026-08-26T10:05:00Z') }, at('2026-08-26T10:06:00Z'))).toBe(true);
  });
});

describe('ORDER_EXPIRATION', () => {
  it('is five minutes, in ISO 8601 duration form', () => {
    // MP's default is 15 minutes, which is far too long for a shared printed
    // QR: an abandoned charge would stay armed while the next member walks up.
    expect(ORDER_EXPIRATION).toBe('PT5M');
    expect(ORDER_EXPIRATION_MS).toBe(5 * 60 * 1000);
  });
});
