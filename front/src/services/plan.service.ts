import type { Plan } from '../types/plan';

const API_URL = 'http://localhost:3000/api/v1/plan';

export const getPlanes = async (): Promise<Plan[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener lista de planes');
  }
  return await response.json();
};

export const getPlanById = async (id: number): Promise<Plan> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener plan ${id}`);
  }
  return await response.json();
};

export const createPlan = async (plan: Plan): Promise<Plan> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!response.ok) {
    throw new Error('Error al crear plan');
  }
  return await response.json();
};

export const updatePlan = async (plan: Plan): Promise<Plan> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar plan');
  }
  return await response.json();
};

export const deletePlan = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar plan ${id}`);
  }
  return await response.json();
};

export const restorePlan = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar plan ${id}`);
  }
  return await response.json();
};
