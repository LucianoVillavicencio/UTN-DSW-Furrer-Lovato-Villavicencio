import type { Clase } from '../types/clase';

const API_URL = 'http://localhost:3000/api/v1/clase';

export const getClases = async (): Promise<Clase[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener lista de clases');
  }
  return await response.json();
};

export const getClaseById = async (id: number): Promise<Clase> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener clase ${id}`);
  }
  return await response.json();
};

export const createClase = async (clase: Clase): Promise<Clase> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clase),
  });
  if (!response.ok) {
    throw new Error('Error al crear clase');
  }
  return await response.json();
};

export const updateClase = async (clase: Clase): Promise<Clase> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clase),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar clase');
  }
  return await response.json();
};

export const deleteClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar clase ${id}`);
  }
  return await response.json();
};

export const restoreClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar clase ${id}`);
  }
  return await response.json();
};
