import type { Class } from "./class";

export interface ClassSession {
  id?: number;
  claseId: number;
  class?: Class;
  dateTime: string;
  maxCapacity: number;
  availableSpots?: number;
  deleted?: boolean;
}
