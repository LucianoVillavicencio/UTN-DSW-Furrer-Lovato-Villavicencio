export interface Profesor {
  dni: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  especialidad?: string | null;
  deleted?: boolean;
}
