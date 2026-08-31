import { describe, expect, it } from 'vitest';
import { formatPaymentDate } from './payment-date';

describe('formatPaymentDate', () => {
  it('keeps a late-evening payment on the day it was taken', () => {
    // 21:30 in Argentina (UTC-3) on the 30th serialises as 00:30Z on the 31st.
    // Slicing the ISO string filed it under the 31st.
    expect(formatPaymentDate('2026-08-31T00:30:00.000Z')).toBe(
      new Date(2026, 7, 30).toLocaleDateString('es-AR'),
    );
  });

  it('formats a morning payment as that same day', () => {
    expect(formatPaymentDate('2026-08-30T13:00:00.000Z')).toBe(
      new Date(2026, 7, 30).toLocaleDateString('es-AR'),
    );
  });

  it('passes a date-only string straight through', () => {
    expect(formatPaymentDate('2026-08-30')).toBe(
      new Date(2026, 7, 30).toLocaleDateString('es-AR'),
    );
  });
});
