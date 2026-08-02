import type { Suscripcion } from '../types/suscripcion';

const API_URL = 'http://localhost:3000/api/v1/suscripcion';

export const getSuscripciones = async (): Promise<Suscripcion[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener suscripciones');
  }
  return await response.json();
};

export const getSuscripcionById = async (id: number): Promise<Suscripcion> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener suscripción ${id}`);
  }
  return await response.json();
};

export const createSuscripcion = async (suscripcion: Suscripcion): Promise<Suscripcion> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suscripcion),
  });
  if (!response.ok) {
    throw new Error('Error al crear suscripción');
  }
  return await response.json();
};

export const updateSuscripcion = async (suscripcion: Suscripcion): Promise<Suscripcion> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suscripcion),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar suscripción');
  }
  return await response.json();
};

export const deleteSuscripcion = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar suscripción ${id}`);
  }
  return await response.json();
};

export const restoreSuscripcion = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar suscripción ${id}`);
  }
  return await response.json();
};
