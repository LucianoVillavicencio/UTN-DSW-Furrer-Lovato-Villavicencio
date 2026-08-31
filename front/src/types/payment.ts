import type { Subscription } from './subscription';

export interface Payment {
  id?: number;
  subscriptionId: number;
  subscription?: Subscription;
  amount: number;
  date: string;
  payMethod: string;
  state?: string;
  registeredById?: number | null;
  // Populated by the backend join when available; a raw id means nothing to
  // staff, so the admin table renders this instead.
  registeredByName?: string | null;
  termMonths?: number;
  // MySQL DECIMAL columns — may arrive as strings despite these types.
  monthlyPriceAtPurchase?: number | string;
  refundedAmount?: number | string | null;
  refundedAt?: string | null;
  deleted?: boolean;
}

// Body of POST /Payment/manual: an in-person payment recorded by an admin.
export interface ManualPaymentPayload {
  subscriptionId: number;
  amount: number;
  payMethod: 'efectivo' | 'debito' | 'credito' | 'transferencia';
  // Only meaningful for an advance payment against an already-ACTIVE
  // subscription; the backend defaults to 1 when omitted.
  termMonths?: number;
}
