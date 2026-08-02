import type { Pago } from '../types/pago';

const API_URL = 'http://localhost:3000/api/v1/pago';

export const getPagos = async (): Promise<Pago[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener lista de pagos');
  }
  return await response.json();
};

export const getPagoById = async (id: number): Promise<Pago> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener pago ${id}`);
  }
  return await response.json();
};

export const createPago = async (pago: Pago): Promise<Pago> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pago),
  });
  if (!response.ok) {
    throw new Error('Error al registrar pago');
  }
  return await response.json();
};

export const updatePago = async (pago: Pago): Promise<Pago> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pago),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar pago');
  }
  return await response.json();
};

export const deletePago = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar pago ${id}`);
  }
  return await response.json();
};

export const restorePago = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar pago ${id}`);
  }
  return await response.json();
};
