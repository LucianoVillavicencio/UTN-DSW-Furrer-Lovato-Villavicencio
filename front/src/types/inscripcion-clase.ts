import type { User } from './user';
import type { TurnoClase } from './turno-clase';

export interface InscripcionClase {
  id?: number;
  userDni: number;
  user?: User;
  turnoClaseId: number;
  turnoClase?: TurnoClase;
  fechaInscripcion?: string;
  estado?: string;
  deleted?: boolean;
}
