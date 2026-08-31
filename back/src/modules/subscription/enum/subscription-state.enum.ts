export enum SubscriptionState {
  // Opened by a self-service plan change and invisible to everything that
  // gates on an active plan, until a recorded payment promotes it to ACTIVE.
  PENDING = 'pendiente',
  ACTIVE = 'activa',
  INACTIVE = 'inactiva',
  CANCELLED = 'cancelada',
  // A hold on an otherwise-paid membership. This is a `state`, not a boolean
  // `paused` flag alongside `state: ACTIVE`, because findActiveForUser's
  // access check filters on `state: SubscriptionState.ACTIVE` and nothing
  // else — moving a subscription to PAUSED denies access on the very next
  // request with no change to that method, which is deliberately left alone
  // (FLG-SEC-24, FLG-SEC-10). A flag would have needed a second condition
  // wired into the access-control boundary itself to have the same effect.
  PAUSED = 'pausada',
}
