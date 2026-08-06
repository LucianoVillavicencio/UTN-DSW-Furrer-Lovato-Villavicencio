import type { Subscription } from "./subscription";


export interface Payment{
  id?: number;
  subscriptionId: number;
  subscription?: Subscription;
  amount: number;
  payDate: string;
  payMethod: string;
  state?: string;
  deleted?: boolean;
}
