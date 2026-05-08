export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  planId?: string;
  estadoSuscripcion: 'Activa' | 'Inactiva' | 'Pendiente';
}

export interface TipoClase {
  id: string;
  nombre: string;
  descripcion: string;
  caloriasAprox: number;
}

export interface Clase {
  id: string;
  tipoClaseId: string;
  profesor: string;
  horario: string;
  dia: string;
  cupoMaximo: number;
  cupoActual: number;
}

export interface TurnoClase {
  id: string;
  claseId: string;
  clienteId: string;
  fecha: string;
  estado: 'Confirmado' | 'Cancelado' | 'Asistio';
}
