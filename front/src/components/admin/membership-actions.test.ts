import { describe, expect, it } from 'vitest';
import { refundSummary, zeroRefundReason } from './membership-actions';
import type { RefundQuote } from '../../types/refund';

const quote: RefundQuote = {
  subscriptionId: 1,
  paymentId: 10,
  totalPaid: 19995,
  monthsUsed: 1,
  regularMonthlyPrice: 19995,
  refundAmount: 13330,
  reason: null,
};

describe('refundSummary', () => {
  it('includes total paid, months used, monthly rate and refund amount', () => {
    const summary = refundSummary(quote);
    expect(summary).toContain(formatted(quote.totalPaid));
    expect(summary).toContain(String(quote.monthsUsed));
    expect(summary).toContain(formatted(quote.regularMonthlyPrice));
    expect(summary).toContain(formatted(quote.refundAmount));
  });
});

describe('zeroRefundReason', () => {
  it('returns the backend reason when refundAmount is 0', () => {
    expect(
      zeroRefundReason({
        ...quote,
        refundAmount: 0,
        reason: 'Ya se usó todo el período pagado.',
      }),
    ).toBe('Ya se usó todo el período pagado.');
  });

  it('returns null when refundAmount is 0 but reason is null', () => {
    expect(
      zeroRefundReason({ ...quote, refundAmount: 0, reason: null }),
    ).toBeNull();
  });

  it('returns null when refundAmount is greater than 0, even with a reason set', () => {
    expect(
      zeroRefundReason({
        ...quote,
        refundAmount: 13330,
        reason: 'Esto no debería importar.',
      }),
    ).toBeNull();
  });
});

// Local helper mirroring formatPriceDisplay's Argentine-format output, kept
// deliberately independent of the implementation's import so the test still
// catches a formatting regression instead of just echoing it back.
function formatted(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
}
