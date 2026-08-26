import { MercadoPagoConfig } from './mercadopago.config';

const full = {
  MP_ENABLED: 'true',
  MP_ACCESS_TOKEN: 'APP_USR-token',
  MP_PUBLIC_KEY: 'APP_USR-key',
  MP_WEBHOOK_SECRET: 'secret',
  MP_POINT_TERMINAL_ID: 'NEWLAND_N950__N950NCB801293324',
  MP_QR_EXTERNAL_POS_ID: 'FLGPOS001',
};
const configOf = (env: Record<string, string | undefined>) =>
  new MercadoPagoConfig({ get: (k: string) => env[k] } as never);

describe('MercadoPagoConfig', () => {
  it('is disabled when MP_ENABLED is absent, and needs no credentials', () => {
    // Cash, refunds of cash, freezing and term sales must all work in a
    // checkout with no Mercado Pago credentials at all.
    expect(configOf({}).enabled).toBe(false);
  });

  it('only treats the literal "true" as enabled', () => {
    // Same opt-in-by-name rule as NODE_ENV in typeorm.config.ts: a typo must
    // fail closed, never quietly start charging cards.
    expect(configOf({ ...full, MP_ENABLED: 'TRUE' }).enabled).toBe(false);
    expect(configOf({ ...full, MP_ENABLED: '1' }).enabled).toBe(false);
    expect(configOf(full).enabled).toBe(true);
  });

  it('exposes the credentials and both collection point ids when enabled', () => {
    const config = configOf(full);
    expect(config.accessToken).toBe('APP_USR-token');
    expect(config.webhookSecret).toBe('secret');
    expect(config.pointTerminalId).toBe('NEWLAND_N950__N950NCB801293324');
    expect(config.qrExternalPosId).toBe('FLGPOS001');
  });

  it.each(['MP_ACCESS_TOKEN', 'MP_PUBLIC_KEY', 'MP_WEBHOOK_SECRET'])(
    'refuses to start enabled without %s',
    (missing) => {
      expect(() => configOf({ ...full, [missing]: undefined })).toThrow(/MP_ENABLED/);
    },
  );

  it.each(['MP_POINT_TERMINAL_ID', 'MP_QR_EXTERNAL_POS_ID'])(
    'starts without %s, since front-desk collection is optional',
    (missing) => {
      // A deployment doing online renewals only should not be forced to own
      // hardware. chargeOrder refuses at call time instead.
      expect(() => configOf({ ...full, [missing]: undefined })).not.toThrow();
    },
  );
});
