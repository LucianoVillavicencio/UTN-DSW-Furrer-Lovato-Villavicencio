import type { TipoClase } from './tipo-clase';
import type { Profesor } from './profesor';

export interface Clase {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  tipoClaseId: number;
  tipoClase?: TipoClase;
  profesorDni: number;
  profesor?: Profesor;
  deleted?: boolean;
}
