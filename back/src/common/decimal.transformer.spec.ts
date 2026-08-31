import { decimalTransformer } from './decimal.transformer';

// The whole point of this transformer is the `from` direction: mysql2 hands
// DECIMAL/NEWDECIMAL columns back as strings, and every money path in this
// codebase (amount.toFixed(2) for the Mercado Pago order body, the webhook's
// amount comparison, the renewal cron's charge amount) assumes a real number.
describe('decimalTransformer', () => {
  describe('from (database -> entity)', () => {
    it('turns a MySQL DECIMAL string into a real number', () => {
      const result = decimalTransformer.from('19500.00') as number;

      expect(result).toBe(19500);
      expect(typeof result).toBe('number');
    });

    it('keeps the fractional part of a non-round amount', () => {
      expect(decimalTransformer.from('1234.56')).toBe(1234.56);
    });

    it('passes null straight through for a nullable column', () => {
      // Payment.refundedAmount is nullable — a never-refunded payment must
      // stay null, not become 0 (Number(null) === 0 would silently claim a
      // refund of zero was issued).
      expect(decimalTransformer.from(null)).toBeNull();
    });

    it('passes undefined straight through', () => {
      expect(decimalTransformer.from(undefined)).toBeUndefined();
    });
  });

  describe('to (entity -> database)', () => {
    it('passes a number through untouched', () => {
      // TypeORM writes a JS number to a DECIMAL column fine; nothing to do
      // on the way in.
      const result = decimalTransformer.to(19500) as number;

      expect(result).toBe(19500);
      expect(typeof result).toBe('number');
    });

    it('passes null through untouched', () => {
      expect(decimalTransformer.to(null)).toBeNull();
    });
  });
});
