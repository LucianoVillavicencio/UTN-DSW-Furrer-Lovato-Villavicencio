export interface PlanFeature {
  label: string;
  available: boolean;
}

export interface Plan {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  numDays: number;
  features?: PlanFeature[] | null;
  deleted?: boolean;
}
