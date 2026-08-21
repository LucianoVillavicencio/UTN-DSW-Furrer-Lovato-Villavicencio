import type { User } from './user';
import type { ClassSession } from './classSession';

export interface ClassRegistration {
  id?: number;
  userDni: number;
  user?: User;
  classSessionId?: number;
  classSession?: ClassSession;
  // The backend column is `date` (ClassRegistrationDto), not dateRegistration.
  date?: string;
  state?: string;
  deleted?: boolean;
}
