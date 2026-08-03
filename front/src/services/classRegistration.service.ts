import type { ClassRegistration } from "../types/classRegistration";


const API_URL = 'http://localhost:3000/api/v1/classRegistration';

export const getClassRegistration = async (): Promise<ClassRegistration[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener inscripciones');
  }
  return await response.json();
};

export const getClassRegistrationById = async (id: number): Promise<ClassRegistration> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener inscripción ${id}`);
  }
  return await response.json();
};

export const createClassRegistration = async (
  registration: ClassRegistration,
): Promise<ClassRegistration> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registration),
  });
  if (!response.ok) {
    throw new Error('Error al registrar inscripción');
  }
  return await response.json();
};

export const updateClassRegistration = async (
  registration: ClassRegistration,
): Promise<ClassRegistration> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registration),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar inscripción');
  }
  return await response.json();
};

export const deleteClassRegistration = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar inscripción ${id}`);
  }
  return await response.json();
};

export const restoreClassRegistration = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar inscripción ${id}`);
  }
  return await response.json();
};
