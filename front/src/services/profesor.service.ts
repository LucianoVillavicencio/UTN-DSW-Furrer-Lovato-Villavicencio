import type { Profesor } from '../types/profesor';

const API_URL = 'http://localhost:3000/api/v1/profesor';

export const getProfesores = async (): Promise<Profesor[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener lista de profesores');
  }
  return await response.json();
};

export const getProfesorByDni = async (dni: number): Promise<Profesor> => {
  const response = await fetch(`${API_URL}/${dni}`);
  if (!response.ok) {
    throw new Error(`Error al obtener profesor con DNI ${dni}`);
  }
  return await response.json();
};

export const createProfesor = async (profesor: Profesor): Promise<Profesor> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profesor),
  });
  if (!response.ok) {
    throw new Error('Error al crear profesor');
  }
  return await response.json();
};

export const updateProfesor = async (profesor: Profesor): Promise<Profesor> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profesor),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar profesor');
  }
  return await response.json();
};

export const deleteProfesor = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${dni}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar profesor con DNI ${dni}`);
  }
  return await response.json();
};

export const restoreProfesor = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${dni}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar profesor con DNI ${dni}`);
  }
  return await response.json();
};
