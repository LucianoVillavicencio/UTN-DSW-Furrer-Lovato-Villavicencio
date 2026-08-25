import type { Class } from './class';

// Mirrors the backend ClassSession entity. A turno is a WEEKLY slot — a class
// on a weekday at an hour, valid every week — not a one-off date: members
// enroll once and keep the spot. classId, weekday, startTime and maxCapacity
// are NOT NULL columns there, so they are required here too.
export interface ClassSession {
  id?: number;
  classId: number;
  class?: Class;
  // 1 = Monday … 6 = Saturday (the gym is closed on Sundays).
  weekday: number;
  // 'HH:MM:SS' as MySQL returns it; use formatTimeOfDay() to display it.
  startTime: string;
  maxCapacity: number;
  availableSpots?: number;
  deleted?: boolean;
}

// Body of POST /classSession/weekly: every weekday × hour combination becomes a
// slot, so a class's whole schedule is one save.
export interface WeeklyClassSessions {
  classId: number;
  weekdays: number[];
  times: string[];
  maxCapacity: number;
}

export interface WeeklyClassSessionsResult {
  created: number;
  skipped: number;
  // Members already enrolled in that class+hour who were booked into the new
  // days, so an enrollment keeps covering every day the class runs.
  adopted: number;
  sessions: ClassSession[];
}
