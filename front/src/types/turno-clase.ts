import type { Clase } from './clase';

export interface TurnoClase {
  id?: number;
  claseId: number;
  clase?: Clase;
  fechaHora: string;
  cupoMaximo: number;
  cupoDisponible?: number;
  deleted?: boolean;
}
