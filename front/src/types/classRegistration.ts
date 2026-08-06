import type { User } from "./user";
import type { ClassSession } from "./classSession";

export interface ClassRegistration {
  id?: number;
  userDni: number;
  user?: User;
  classSessionId?: number;
  turnoClaseId?: number;
  classSession?: ClassSession;
  dateRegistration?: string;
  fechaInscripcion?: string;
  state?: string;
  estado?: string;
  deleted?: boolean;
}

export type InscripcionClase = ClassRegistration;

