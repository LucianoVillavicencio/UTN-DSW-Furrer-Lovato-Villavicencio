import type { Suscripcion } from './suscripcion';

export interface Pago {
  id?: number;
  suscripcionId: number;
  suscripcion?: Suscripcion;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  estado?: string;
  deleted?: boolean;
}
