// Mirrors the backend's PublicSavedCard (savedCard.mapper.ts) — the only
// shape of a saved card ever allowed to leave the server. mpCardId and
// mpCustomerId never appear here because the backend never sends them.
export interface SavedCard {
  id: number;
  lastFourDigits: string;
  paymentMethodId: string;
  expirationMonth: number;
  expirationYear: number;
}
