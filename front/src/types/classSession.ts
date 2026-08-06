import type { Class } from "./class";

export interface ClassSession {
  id?: number;
  claseId?: number;
  classId?: number;
  class?: Class;
  clase?: any;
  dateTime?: string;
  fechaHora?: string | any;
  maxCapacity?: number;
  cupoMaximo?: number;
  availableSpots?: number;
  cupoDisponible?: number;
  deleted?: boolean;
}

export type TurnoClase = ClassSession;

