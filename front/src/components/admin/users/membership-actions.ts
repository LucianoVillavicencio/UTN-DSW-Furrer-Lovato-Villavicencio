// Pure text helpers for MembershipActionsDialog, kept free of React/DOM so
// they run under plain Vitest: the refund breakdown shown before confirming
// and the backend's reason for a $0 refund. Unit-tested in
// membership-actions.test.ts.

import { formatPriceDisplay } from '../../../lib/currency';
import type { RefundQuote } from '../../../types/refund';

// Renders the Spanish breakdown the dialog shows BEFORE the admin confirms
// the refund: total paid, months used, the regular monthly rate, and the
// resulting refund amount, in that reading order.
export const refundSummary = (quote: RefundQuote): string =>
  `Pagó $${formatPriceDisplay(quote.totalPaid)} y usó ${quote.monthsUsed} ${
    quote.monthsUsed === 1 ? 'mes' : 'meses'
  } a $${formatPriceDisplay(quote.regularMonthlyPrice)} por mes. Reembolso: $${formatPriceDisplay(
    quote.refundAmount,
  )}.`;

// The backend's own Spanish explanation for a $0 refund, passed through
// unchanged — never re-derived here. Only surfaced when refundAmount is
// actually 0: the backend's stated invariant is "reason is non-null only
// when refundAmount is 0", but this function follows refundAmount, not
// reason's mere presence, so a quote shaped some other way never leaks a
// stray reason next to a real refund.
export const zeroRefundReason = (quote: RefundQuote): string | null =>
  quote.refundAmount === 0 ? quote.reason : null;
