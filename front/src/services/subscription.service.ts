import type { Subscription } from "../types/subscription";
import { AxiosError } from "axios";
import api from "./api";

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) return fallback;
  if (!error.response) {
    return "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
  }
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(", ")
    : data?.message;
  return backendMessage || fallback;
};

// Self-service.
export const getMySubscription = async (): Promise<Subscription | null> => {
  try {
    const { data } = await api.get<Subscription | null>("/subscription/me");
    return data ?? null;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "No se pudo obtener tu suscripción."), { cause: error });
  }
};

export const changePlan = async (planId: number): Promise<Subscription> => {
  try {
    const { data } = await api.post<Subscription>("/subscription/change-plan", { planId });
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "No se pudo cambiar de plan."), { cause: error });
  }
};

// Todo lo demás es admin-only: el controller no tenía ningún guard antes
// (cualquiera podía listar todas las suscripciones), así que se pasó a
// @Auth(Role.ADMIN) — estas funciones necesitan el JWT vía `api`.
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const { data } = await api.get<Subscription[]>("/subscription");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener suscripciones"), { cause: error });
  }
};

export const getSubscriptionsByUser = async (dni: number): Promise<Subscription[]> => {
  try {
    const { data } = await api.get<Subscription[]>(`/subscription/by-user/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener las suscripciones del usuario."), { cause: error });
  }
};

export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  try {
    const { data } = await api.get<Subscription>(`/subscription/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener suscripción ${id}`), { cause: error });
  }
};

export const updateSubscription = async (subscription: Subscription): Promise<Subscription> => {
  try {
    const { data } = await api.put<Subscription>("/subscription", subscription);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar suscripción"), { cause: error });
  }
};

// Cancela la suscripción de un usuario (panel admin de Usuarios). No es un
// soft-delete de la fila — cambia el estado a 'cancelada', igual que hace
// changePlan() cuando el usuario elige otro plan. Se arma un payload
// "plano": el DTO del backend usa forbidNonWhitelisted, así que mandar el
// objeto tal como vino de la API (con `plan`/`user` anidados) rebotaría 400.
export const cancelSubscription = async (subscription: Subscription): Promise<Subscription> => {
  return updateSubscription({
    id: subscription.id,
    userDni: subscription.userDni,
    planId: subscription.planId,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    state: "cancelada",
  });
};

export const deleteSubscription = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/subscription/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar suscripción ${id}`), { cause: error });
  }
};

export const restoreSubscription = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/subscription/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar suscripción ${id}`), { cause: error });
  }
};
