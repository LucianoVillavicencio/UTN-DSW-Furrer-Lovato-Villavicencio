import type { Payment } from "../types/payment";


const API_URL = 'http://localhost:3000/api/v1/payment';

export const getPayment = async (): Promise<Payment[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener lista de pagos');
  }
  return await response.json();
};

export const getPaymentById = async (id: number): Promise<Payment> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener pago ${id}`);
  }
  return await response.json();
};

export const createPayment = async (pago: Payment): Promise<Payment> => {
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

export const updatePayment = async (pago: Payment): Promise<Payment> => {
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

export const deletePayment = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error al eliminar pago ${id}`);
  }
  return await response.json();
};

export const restorePayment = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Error al restaurar pago ${id}`);
  }
  return await response.json();
};
