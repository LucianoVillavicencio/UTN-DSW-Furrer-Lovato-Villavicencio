import type { InscripcionClase } from '../types/inscripcion-clase';

const API_URL = 'http://localhost:3000/api/v1/inscripcion-clase';

export const getInscripcionesClase = async (): Promise<InscripcionClase[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener inscripciones');
  }
  return await response.json();
};

export const getInscripcionClaseById = async (id: number): Promise<InscripcionClase> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener inscripción ${id}`);
  }
  return await response.json();
};

export const createInscripcionClase = async (
  inscripcion: InscripcionClase,
): Promise<InscripcionClase> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inscripcion),
  });
  if (!response.ok) {
    throw new Error('Error al registrar inscripción');
  }
  return await response.json();
};

export const updateInscripcionClase = async (
  inscripcion: InscripcionClase,
): Promise<InscripcionClase> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inscripcion),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar inscripción');
  }
  return await response.json();
};

export const deleteInscripcionClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar inscripción ${id}`);
  }
  return await response.json();
};

export const restoreInscripcionClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar inscripción ${id}`);
  }
  return await response.json();
};
