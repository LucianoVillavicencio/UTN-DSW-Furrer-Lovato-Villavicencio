import { describe, expect, it } from 'vitest';
import {
  POLL_INTERVAL_MS,
  hasAutoRenewedToday,
  needsChargeOrder,
  shouldKeepPolling,
  statusLabel,
} from './charge-panel';

describe('POLL_INTERVAL_MS', () => {
  it('is 2 seconds', () => {
    expect(POLL_INTERVAL_MS).toBe(2000);
  });
});

describe('shouldKeepPolling', () => {
  const expiresAt = '2026-08-30T12:05:00.000Z';

  it('keeps polling: pendiente and not yet expired', () => {
    const now = new Date('2026-08-30T12:04:59.000Z');
    expect(shouldKeepPolling('pendiente', expiresAt, now)).toBe(true);
  });

  it('stops polling: pendiente and exactly at expiresAt', () => {
    const now = new Date(expiresAt);
    expect(shouldKeepPolling('pendiente', expiresAt, now)).toBe(false);
  });

  it('stops polling: pendiente and past expiresAt', () => {
    const now = new Date('2026-08-30T12:05:01.000Z');
    expect(shouldKeepPolling('pendiente', expiresAt, now)).toBe(false);
  });

  it.each(['pagada', 'cancelada', 'expirada', 'error'])(
    'stops polling: terminal status %s wins even when not yet expired',
    (status) => {
      const now = new Date('2026-08-30T12:00:00.000Z');
      expect(shouldKeepPolling(status, expiresAt, now)).toBe(false);
    },
  );
});

describe('statusLabel', () => {
  it('pendiente + point -> Esperando tarjeta en Point...', () => {
    expect(statusLabel('pendiente', 'point')).toBe(
      'Esperando tarjeta en Point...',
    );
  });

  it('pendiente + qr -> Esperando escaneo del QR...', () => {
    expect(statusLabel('pendiente', 'qr')).toBe('Esperando escaneo del QR...');
  });

  it.each(['point', 'qr', 'efectivo'] as const)(
    'pagada + %s -> ¡Pago aprobado!',
    (method) => {
      expect(statusLabel('pagada', method)).toBe('¡Pago aprobado!');
    },
  );

  it.each(['point', 'qr', 'efectivo'] as const)(
    'error + %s -> Pago rechazado',
    (method) => {
      expect(statusLabel('error', method)).toBe('Pago rechazado');
    },
  );

  it.each(['point', 'qr', 'efectivo'] as const)(
    'cancelada + %s -> Cobro cancelado',
    (method) => {
      expect(statusLabel('cancelada', method)).toBe('Cobro cancelado');
    },
  );

  it.each(['point', 'qr', 'efectivo'] as const)(
    'expirada + %s -> El cobro venció',
    (method) => {
      expect(statusLabel('expirada', method)).toBe('El cobro venció');
    },
  );
});

describe('needsChargeOrder', () => {
  it('is false for efectivo', () => {
    expect(needsChargeOrder('efectivo')).toBe(false);
  });

  it('is true for point', () => {
    expect(needsChargeOrder('point')).toBe(true);
  });

  it('is true for qr', () => {
    expect(needsChargeOrder('qr')).toBe(true);
  });
});

describe('hasAutoRenewedToday', () => {
  // Built from local components (not a UTC 'Z' string) so the "today" fixture
  // matches localDateOnly's own local getFullYear/getMonth/getDate reading
  // regardless of the machine's timezone running the suite. The payment
  // `date` strings are compared as plain text (slice(0, 10)), so their exact
  // literal — not what timezone it would parse to — is what matters.
  const today = new Date(2026, 7, 30, 12, 0, 0);

  it('a mercadopago payment dated today -> true', () => {
    expect(
      hasAutoRenewedToday(
        [{ payMethod: 'mercadopago', date: '2026-08-30T10:00:00.000Z' }],
        today,
      ),
    ).toBe(true);
  });

  it('a mercadopago payment dated yesterday -> false', () => {
    expect(
      hasAutoRenewedToday(
        [{ payMethod: 'mercadopago', date: '2026-08-29T10:00:00.000Z' }],
        today,
      ),
    ).toBe(false);
  });

  it('an efectivo payment dated today -> false', () => {
    expect(
      hasAutoRenewedToday(
        [{ payMethod: 'efectivo', date: '2026-08-30T10:00:00.000Z' }],
        today,
      ),
    ).toBe(false);
  });

  it('no payments -> false', () => {
    expect(hasAutoRenewedToday([], today)).toBe(false);
  });

  it('multiple payments where only one matches -> true', () => {
    expect(
      hasAutoRenewedToday(
        [
          { payMethod: 'efectivo', date: '2026-08-30T09:00:00.000Z' },
          { payMethod: 'mercadopago', date: '2026-08-29T09:00:00.000Z' },
          { payMethod: 'mercadopago', date: '2026-08-30T20:00:00.000Z' },
        ],
        today,
      ),
    ).toBe(true);
  });
});
