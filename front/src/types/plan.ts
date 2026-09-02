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

// Only 3, 6 and 12 exist. One month is the Plan's own price and numDays and
// never appears as a duration row.
export type DurationMonths = 3 | 6 | 12;

export interface PlanDuration {
  id?: number;
  planId: number;
  months: DurationMonths;
  numDays: number;
  // DECIMAL arrives from the API as a string; see lib/currency.ts.
  price: number | string;
  deleted?: boolean;
}
