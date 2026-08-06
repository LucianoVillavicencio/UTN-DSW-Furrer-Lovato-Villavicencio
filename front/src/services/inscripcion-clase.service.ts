import type { InscripcionClase } from '../types/inscripcion-clase';

const API_URL = 'http://localhost:3000/api/v1/inscripcion-clase';

export const getInscripcionesClase = async (): Promise<InscripcionClase[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : 'Error al obtener inscripciones';
    throw new Error(message);
  }
  return await response.json();
};

export const getInscripcionClaseById = async (id: number): Promise<InscripcionClase> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : `Error al obtener inscripción ${id}`;
    throw new Error(message);
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
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : 'Error al registrar inscripción';
    throw new Error(message);
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
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : 'Error al actualizar inscripción';
    throw new Error(message);
  }
  return await response.json();
};

export const deleteInscripcionClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : `Error al eliminar inscripción ${id}`;
    throw new Error(message);
  }
  return await response.json();
};

export const restoreInscripcionClase = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message
      ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message)
      : `Error al restaurar inscripción ${id}`;
    throw new Error(message);
  }
  return await response.json();
};

