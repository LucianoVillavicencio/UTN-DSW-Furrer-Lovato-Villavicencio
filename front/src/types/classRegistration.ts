import type { User } from './user';
import type { ClassSession } from './classSession';

// One enrollment as the member holds it: a class at an hour, booked on every
// weekday that class runs at that hour, week after week.
export interface Enrollment {
  group: string;
  classId: number;
  className: string;
  // 'HH:MM:SS', as the backend stores it.
  startTime: string;
  weekdays: number[];
  sessionIds: number[];
  since: string;
}

// GET /classRegistration/me — what the member holds plus what their plan lets
// them do, so the classes page never offers an action the backend will refuse.
export interface MyEnrollments {
  enrollments: Enrollment[];
  hasActivePlan: boolean;
  planName: string | null;
  // 0 = no classes, N = up to N at a time, null = unlimited.
  maxClasses: number | null;
  changesUsed: number;
  // null on a plan with unlimited classes: there is no monthly cap then.
  changesLeft: number | null;
  resetsOn: string;
}

export interface ClassRegistration {
  id?: number;
  userId: number;
  user?: User;
  classSessionId?: number;
  classSession?: ClassSession;
  // The backend column is `date` (ClassRegistrationDto), not dateRegistration.
  date?: string;
  state?: string;
  deleted?: boolean;
}
