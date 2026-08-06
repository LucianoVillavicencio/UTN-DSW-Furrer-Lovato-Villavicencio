import type { User } from "./user";
import type { ClassSession } from "./classSession";

export interface ClassRegistration {
  id?: number;
  userDni: number;
  user?: User;
  classSessionId: number;
  classSession?: ClassSession;
  dateRegistration?: string;
  state?: string;
  deleted?: boolean;
}
