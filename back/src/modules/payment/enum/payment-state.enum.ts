export enum PaymentState {
  PENDING = 'pendiente',
  COMPLETED = 'completado',
  FAILED = 'rechazado',      // Si la tarjeta o el medio de pago falló
  REFUNDED = 'reembolsado'   // Si le devuelven el dinero al cliente
}