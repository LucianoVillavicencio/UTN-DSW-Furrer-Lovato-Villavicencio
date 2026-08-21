import type { Subscription } from './subscription';

export interface Payment {
  id?: number;
  subscriptionId: number;
  subscription?: Subscription;
  amount: number;
  date: string;
  payMethod: string;
  state?: string;
  registeredByDni?: number | null;
  deleted?: boolean;
}

// Body of POST /Payment/manual: an in-person payment recorded by an admin.
export interface ManualPaymentPayload {
  subscriptionId: number;
  amount: number;
  payMethod: 'efectivo' | 'debito' | 'credito' | 'transferencia';
}
