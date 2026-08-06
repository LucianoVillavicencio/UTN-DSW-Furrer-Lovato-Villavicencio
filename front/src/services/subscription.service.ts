import type { Subscription } from "../types/subscription";


const API_URL = "http://localhost:3000/api/v1/subcription";

export const getSubscription = async (): Promise<Subscription[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener suscripciones");
  }
  return await response.json();
};

export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener suscripción ${id}`);
  }
  return await response.json();
};

export const createSubscription = async (
  subcription: Subscription,
): Promise<Subscription> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subcription),
  });
  if (!response.ok) {
    throw new Error("Error al crear suscripción");
  }
  return await response.json();
};

export const updateSubcription = async (
  subcription: Subscription,
): Promise<Subscription> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subcription),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar suscripción");
  }
  return await response.json();
};

export const deleteSubcription = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar suscripción ${id}`);
  }
  return await response.json();
};

export const restoreSubcription = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error(`Error al restaurar suscripción ${id}`);
  }
  return await response.json();
};
