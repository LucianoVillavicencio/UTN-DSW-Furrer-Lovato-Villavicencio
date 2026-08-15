import type { Subscription } from "../types/subscription";

const API_URL = "http://localhost:3000/api/v1/subscription";

export const getSubscriptions = async (): Promise<Subscription[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener suscripciones");
  }
  return await response.json();
};

export const getSubscription = getSubscriptions;

export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener suscripción ${id}`);
  }
  return await response.json();
};

export const createSubscription = async (
  subscription: Subscription,
): Promise<Subscription> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al crear suscripción");
  }
  return await response.json();
};

export const updateSubscription = async (
  subscription: Subscription,
): Promise<Subscription> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar suscripción");
  }
  return await response.json();
};

export const updateSubcription = updateSubscription;

export const deleteSubscription = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar suscripción ${id}`);
  }
  return await response.json();
};

export const deleteSubcription = deleteSubscription;

export const restoreSubscription = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error(`Error al restaurar suscripción ${id}`);
  }
  return await response.json();
};

export const restoreSubcription = restoreSubscription;

