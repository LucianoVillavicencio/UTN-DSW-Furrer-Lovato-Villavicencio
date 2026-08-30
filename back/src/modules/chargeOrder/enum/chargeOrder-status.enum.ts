// Mirrors SubscriptionState's own convention: Spanish string values, since
// these surface directly in admin screens and (indirectly, through
// ConflictException messages) to front-desk staff.
export enum ChargeOrderStatus {
  // Armed and waiting for Mercado Pago to report a result, or for
  // expireStale() to flip it to EXPIRED once expiresAt passes.
  PENDING = 'pendiente',
  // Closed by closeAsPaid once the webhook (Task 16+) confirms the payment.
  PAID = 'pagada',
  // Closed by cancel — an admin backed out of the charge before it settled.
  CANCELLED = 'cancelada',
  // Set in bulk by expireStale() for any PENDING row past its expiresAt.
  EXPIRED = 'expirada',
  // Closed by closeAsError when Mercado Pago reports the order failed.
  ERROR = 'error',
}
