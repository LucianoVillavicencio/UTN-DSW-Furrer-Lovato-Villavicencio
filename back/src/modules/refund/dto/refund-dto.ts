// Shape of the pro-rata refund preview returned by
// GET /api/v1/refund/quote/:subscriptionId. Both routes in this module take
// their identifying id from the URL and (for `issue`) the acting admin from
// the JWT — neither has a request body — so this DTO exists purely to type
// (and document) `RefundService.quote`'s response, not to validate input.
export class RefundQuoteDto {
  subscriptionId!: number;
  paymentId!: number;

  // What the member actually paid for the current term (Payment.amount —
  // the ground truth of what was charged, not termMonths *
  // monthlyPriceAtPurchase recomputed, which would silently ignore any
  // per-payment discount/override quirk).
  totalPaid!: number;

  // How many billing periods of the current term have already started.
  monthsUsed!: number;

  // The snapshotted Payment.monthlyPriceAtPurchase — never today's plan
  // price, which may have changed since the sale.
  regularMonthlyPrice!: number;

  refundAmount!: number;

  // Set (non-null) only when refundAmount is 0, explaining why in Spanish
  // for the admin screen — a $0 quote is a real, reportable outcome, not a
  // refusal.
  reason!: string | null;
}
