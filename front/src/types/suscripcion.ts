import type { User } from './user';
import type { Plan } from './plan';

export interface Suscripcion {
  id?: number;
  userDni: number;
  user?: User;
  planId: number;
  plan?: Plan;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
  deleted?: boolean;
}
