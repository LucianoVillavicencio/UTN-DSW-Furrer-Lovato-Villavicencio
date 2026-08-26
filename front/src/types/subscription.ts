import type { User } from './user';
import type { Plan } from './plan';

export interface Subscription {
  id?: number;
  userId: number;
  user?: User;
  planId: number;
  plan?: Plan;
  startDate: string;
  endDate: string;
  state?: string;
  deleted?: boolean;
}
