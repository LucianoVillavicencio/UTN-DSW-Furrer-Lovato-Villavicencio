import {
  buildExternalReference,
  isExpired,
  ORDER_EXPIRATION,
  ORDER_EXPIRATION_MS,
} from './chargeOrder.rules';

describe('buildExternalReference', () => {
  // Keyed on the member, not the subscription: a charge order is now armed
  // before any subscription exists.
  it('builds a reference from the user id', () => {
    expect(buildExternalReference(42, 'a1b2c3d4')).toBe('flg-user-42-a1b2c3d4');
  });

  it('stays within Mercado Pago 64-character limit', () => {
    expect(buildExternalReference(999999999, 'a1b2c3d4').length).toBeLessThanOrEqual(64);
  });

  it('uses only characters Mercado Pago accepts', () => {
    expect(buildExternalReference(42, 'a1b2c3d4')).toMatch(/^[A-Za-z0-9_-]+$/);
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
