import type { Class } from './class';

// Mirrors the backend ClassSession entity. classId, dateTime and maxCapacity
// are NOT NULL columns there, so they are required here too — leaving them
// optional forced every consumer to invent a fallback for a value the API
// always sends.
export interface ClassSession {
  id?: number;
  classId: number;
  class?: Class;
  dateTime: string;
  maxCapacity: number;
  availableSpots?: number;
  deleted?: boolean;
}
