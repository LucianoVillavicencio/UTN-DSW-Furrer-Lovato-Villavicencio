// Mirrors back/src/modules/refund/dto/refund-dto.ts (RefundQuoteDto) — the
// pro-rata refund preview GET /refund/quote/:subscriptionId returns.
export interface RefundQuote {
  subscriptionId: number;
  paymentId: number;
  totalPaid: number;
  monthsUsed: number;
  regularMonthlyPrice: number;
  refundAmount: number;
  // Non-null ONLY when refundAmount === 0 — explains why in Spanish.
  reason: string | null;
}
