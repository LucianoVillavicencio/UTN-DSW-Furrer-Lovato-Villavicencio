import type { TurnoClase } from '../types/turno-clase';

const API_URL = 'http://localhost:3000/api/v1/turno-clase';

export const getTurnosClase = async (): Promise<TurnoClase[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener turnos de clase');
  }
  return await response.json();
};

export const getTurnoClaseById = async (id: number): Promise<TurnoClase> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener turno de clase ${id}`);
  }
  return await response.json();
};

export const createTurnoClase = async (turnoClase: TurnoClase): Promise<TurnoClase> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(turnoClase),
  });
  if (!response.ok) {
    throw new Error('Error al crear turno de clase');
  }
  return await response.json();
};

export const updateTurnoClase = async (turnoClase: TurnoClase): Promise<TurnoClase> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(turnoClase),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar turno de clase');
  }
  return await response.json();
};

export const deleteTurnoClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar turno de clase ${id}`);
  }
  return await response.json();
};

export const restoreTurnoClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar turno de clase ${id}`);
  }
  return await response.json();
};
