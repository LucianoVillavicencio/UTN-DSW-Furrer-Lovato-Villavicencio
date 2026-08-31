import { createHmac } from 'node:crypto';
import {
  buildSignatureManifest,
  parseSignatureHeader,
  verifyWebhookSignature,
} from './mercadopago.rules';

const SECRET = 'un-secreto-de-prueba';
const sign = (manifest: string) =>
  createHmac('sha256', SECRET).update(manifest).digest('hex');

describe('parseSignatureHeader', () => {
  it('extracts ts and v1', () => {
    expect(
      parseSignatureHeader('ts=1742505638683,v1=ced36ab6d33566bb'),
    ).toEqual({
      ts: '1742505638683',
      v1: 'ced36ab6d33566bb',
    });
  });

  it('tolerates whitespace around the parts', () => {
    expect(parseSignatureHeader('ts=123, v1=abc')).toEqual({
      ts: '123',
      v1: 'abc',
    });
  });

  it('returns null for a header it cannot read', () => {
    expect(parseSignatureHeader('')).toBeNull();
    expect(parseSignatureHeader('v1=abc')).toBeNull();
    expect(parseSignatureHeader('ts=123')).toBeNull();
  });
});

describe('buildSignatureManifest', () => {
  it('follows the documented template', () => {
    expect(
      buildSignatureManifest({
        dataId: '123456',
        requestId: 'bb56a2f1-6aae-46ac-982e-9dcd3581d08e',
        ts: '1742505638683',
      }),
    ).toBe(
      'id:123456;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:1742505638683;',
    );
  });

  it('lowercases an alphanumeric data.id', () => {
    // Order ids arrive uppercase and MP hashes them lowercased. Getting this
    // wrong rejects every Point and QR notification while letting the online
    // card ones (all digits) through — a bug that looks like a hardware
    // problem and is not.
    expect(
      buildSignatureManifest({
        dataId: 'ORD01JQ4S4KY8HWQ6NA5PXB65B3D3',
        requestId: 'req-1',
        ts: '123',
      }),
    ).toBe('id:ord01jq4s4ky8hwq6na5pxb65b3d3;request-id:req-1;ts:123;');
  });

  it('omits a component that is absent rather than emptying it', () => {
    // The docs are explicit: a missing value is removed from the manifest.
    // "id:;request-id:req-1;ts:123;" would hash to something MP never signed.
    expect(
      buildSignatureManifest({
        dataId: undefined,
        requestId: 'req-1',
        ts: '123',
      }),
    ).toBe('request-id:req-1;ts:123;');
    expect(
      buildSignatureManifest({ dataId: '9', requestId: undefined, ts: '123' }),
    ).toBe('id:9;ts:123;');
  });
});

describe('verifyWebhookSignature', () => {
  const ts = String(Date.now());
  const manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const valid = {
    signatureHeader: `ts=${ts},v1=${sign(manifest)}`,
    requestId: 'req-1',
    dataId: '123456',
  };

  it('accepts a correctly signed notification', () => {
    expect(verifyWebhookSignature(valid, SECRET, new Date())).toBe(true);
  });

  it('rejects a tampered data.id', () => {
    // The whole point: an attacker swapping in another payment's id must fail.
    expect(
      verifyWebhookSignature(
        { ...valid, dataId: '999999' },
        SECRET,
        new Date(),
      ),
    ).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    expect(verifyWebhookSignature(valid, 'otro-secreto', new Date())).toBe(
      false,
    );
  });

  it('rejects a malformed header instead of throwing', () => {
    expect(
      verifyWebhookSignature(
        { ...valid, signatureHeader: 'garbage' },
        SECRET,
        new Date(),
      ),
    ).toBe(false);
  });

  it('rejects a replay older than five minutes', () => {
    const old = String(Date.now() - 6 * 60 * 1000);
    const oldManifest = `id:123456;request-id:req-1;ts:${old};`;
    expect(
      verifyWebhookSignature(
        { ...valid, signatureHeader: `ts=${old},v1=${sign(oldManifest)}` },
        SECRET,
        new Date(),
      ),
    ).toBe(false);
  });

  it('accepts a notification four minutes old', () => {
    const recent = String(Date.now() - 4 * 60 * 1000);
    const recentManifest = `id:123456;request-id:req-1;ts:${recent};`;
    expect(
      verifyWebhookSignature(
        {
          ...valid,
          signatureHeader: `ts=${recent},v1=${sign(recentManifest)}`,
        },
        SECRET,
        new Date(),
      ),
    ).toBe(true);
  });

  // Confirmed by capturing live Point `order`-topic deliveries: Mercado
  // Pago sends `ts` as Unix SECONDS on some notifications (and retries of
  // the very same event), not the milliseconds their docs describe. A
  // seconds-based `ts` compared directly against `now.getTime()`
  // (milliseconds) reads as ~1970 and was silently rejecting every one of
  // these — this is the regression test for that bug, not a hypothetical.
  it('accepts a fresh notification whose ts is in seconds, not milliseconds', () => {
    const nowMs = Date.now();
    const tsSeconds = String(Math.floor(nowMs / 1000));
    const secondsManifest = `id:123456;request-id:req-1;ts:${tsSeconds};`;
    expect(
      verifyWebhookSignature(
        {
          ...valid,
          signatureHeader: `ts=${tsSeconds},v1=${sign(secondsManifest)}`,
        },
        SECRET,
        new Date(nowMs),
      ),
    ).toBe(true);
  });

  it('rejects a replay older than five minutes when ts is in seconds', () => {
    const oldSeconds = String(Math.floor((Date.now() - 6 * 60 * 1000) / 1000));
    const oldManifest = `id:123456;request-id:req-1;ts:${oldSeconds};`;
    expect(
      verifyWebhookSignature(
        {
          ...valid,
          signatureHeader: `ts=${oldSeconds},v1=${sign(oldManifest)}`,
        },
        SECRET,
        new Date(),
      ),
    ).toBe(false);
  });
});
