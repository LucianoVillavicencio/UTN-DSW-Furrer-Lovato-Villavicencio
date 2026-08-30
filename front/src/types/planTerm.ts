// Mirrors the backend's PlanTerm entity (back/src/modules/planTerm). `plan`
// is omitted here: the eager-loaded relation nothing on the frontend reads.
export interface PlanTerm {
  id: number;
  planId: number;
  months: number;
  // MySQL DECIMAL — may arrive as a string despite this type.
  price: number | string;
  deleted: boolean;
}
