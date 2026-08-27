import { SavedCard } from './entity/savedCard.entity';

/** The only shape of a saved card ever allowed to leave the server. */
export interface PublicSavedCard {
  lastFourDigits: string;
  paymentMethodId: string;
  expirationMonth: number;
  expirationYear: number;
}

// mpCardId and mpCustomerId identify a real Mercado Pago payment instrument
// and must never reach the browser. This is the single place that decides
// what a SavedCard row is allowed to become over HTTP — used by BOTH the GET
// and POST routes in savedCard.controller.ts, so a leak on one response
// cannot happen without the shared mapper (and its test) catching it too.
export function toPublicCard(card: SavedCard): PublicSavedCard {
  return {
    lastFourDigits: card.lastFourDigits,
    paymentMethodId: card.paymentMethodId,
    expirationMonth: card.expirationMonth,
    expirationYear: card.expirationYear,
  };
}
