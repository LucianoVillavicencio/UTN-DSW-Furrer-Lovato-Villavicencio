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
  // Classes the plan includes: 0 = none, N = up to N at a time, null =
  // unlimited. Absent only on a payload that is not touching it.
  maxClasses?: number | null;
  highlighted?: boolean;
  deleted?: boolean;
}
