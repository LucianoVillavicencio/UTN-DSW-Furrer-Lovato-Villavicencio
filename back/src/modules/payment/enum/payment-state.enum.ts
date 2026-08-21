export enum PaymentState {
  PENDING = 'pendiente',
  COMPLETED = 'completado',
  FAILED = 'rechazado', // The card or the payment method was rejected
  REFUNDED = 'reembolsado', // The money was returned to the member
}
