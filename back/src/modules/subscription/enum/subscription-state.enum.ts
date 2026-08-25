export enum SubscriptionState {
  // Opened by a self-service plan change and invisible to everything that
  // gates on an active plan, until a recorded payment promotes it to ACTIVE.
  PENDING = 'pendiente',
  ACTIVE = 'activa',
  INACTIVE = 'inactiva',
  CANCELLED = 'cancelada',
}
