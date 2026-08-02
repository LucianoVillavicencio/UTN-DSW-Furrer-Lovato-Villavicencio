import type { TipoClase } from '../types/tipo-clase';

const API_URL = 'http://localhost:3000/api/v1/tipo-clase';

export const getTiposClase = async (): Promise<TipoClase[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener tipos de clase');
  }
  return await response.json();
};

export const getTipoClaseById = async (id: number): Promise<TipoClase> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener tipo de clase ${id}`);
  }
  return await response.json();
};

export const createTipoClase = async (tipoClase: TipoClase): Promise<TipoClase> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tipoClase),
  });
  if (!response.ok) {
    throw new Error('Error al crear tipo de clase');
  }
  return await response.json();
};

export const updateTipoClase = async (tipoClase: TipoClase): Promise<TipoClase> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tipoClase),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar tipo de clase');
  }
  return await response.json();
};

export const deleteTipoClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar tipo de clase ${id}`);
  }
  return await response.json();
};

export const restoreTipoClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar tipo de clase ${id}`);
  }
  return await response.json();
};
