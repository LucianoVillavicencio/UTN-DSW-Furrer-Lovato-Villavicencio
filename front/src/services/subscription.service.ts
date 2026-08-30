import type { Subscription } from '../types/subscription';
import { AxiosError } from 'axios';
import api from './api';

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) return fallback;
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message;
  return backendMessage || fallback;
};

// Self-service.
export const getMySubscription = async (): Promise<Subscription | null> => {
  try {
    const { data } = await api.get<Subscription | null>('/subscription/me');
    return data ?? null;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, 'No se pudo obtener tu suscripción.'),
      { cause: error },
    );
  }
};

// planTermId is optional: omitting it keeps today's behavior, defaulting to
// the plan's 1-month term server-side.
export const changePlan = async (
  planId: number,
  planTermId?: number,
): Promise<Subscription> => {
  try {
    const { data } = await api.post<Subscription>('/subscription/change-plan', {
      planId,
      ...(planTermId !== undefined ? { planTermId } : {}),
    });
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'No se pudo cambiar de plan.'), {
      cause: error,
    });
  }
};

// Self-service: turning it off always succeeds; turning it on without an
// active, chargeable saved card 409s (see subscription.controller.ts).
export const setAutoRenew = async (
  autoRenew: boolean,
): Promise<Subscription> => {
  try {
    const { data } = await api.patch<Subscription>(
      '/subscription/me/auto-renew',
      { autoRenew },
    );
    return data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, 'No se pudo actualizar la renovación automática.'),
      { cause: error },
    );
  }
};

// Admin-side counterpart of changePlan: closes the member's active
// subscription, if any, and opens one on the chosen plan. The id travels in
// the path because the JWT here belongs to the admin, not to the member.
export const assignPlanToMember = async (
  userId: number,
  planId: number,
): Promise<Subscription> => {
  try {
    const { data } = await api.post<Subscription>(
      `/subscription/admin/${userId}`,
      { planId },
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo asignar el plan.'), {
      cause: error,
    });
  }
};

// Everything below is admin-only. The controller had no guard at all before —
// anyone could list every subscription — so it moved to @Auth(Role.ADMIN), and
// these functions need the JWT that `api` attaches.
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const { data } = await api.get<Subscription[]>('/subscription');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener suscripciones'), {
      cause: error,
    });
  }
};

export const getSubscriptionsByUser = async (
  userId: number,
): Promise<Subscription[]> => {
  try {
    const { data } = await api.get<Subscription[]>(
      `/subscription/by-user/${userId}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo obtener las suscripciones del usuario.',
      ),
      { cause: error },
    );
  }
};

export const getSubscriptionById = async (
  id: number,
): Promise<Subscription> => {
  try {
    const { data } = await api.get<Subscription>(`/subscription/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, `Error al obtener suscripción ${id}`),
      { cause: error },
    );
  }
};

export const updateSubscription = async (
  subscription: Subscription,
): Promise<Subscription> => {
  try {
    const { data } = await api.put<Subscription>('/subscription', subscription);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar suscripción'), {
      cause: error,
    });
  }
};

// Cancels a user's subscription (admin Users panel). Not a soft-delete of the
// row: it moves the state to 'cancelada', the same thing changePlan() does when
// the user picks another plan. The payload is flattened on purpose — the
// backend DTO uses forbidNonWhitelisted, so posting the object as the API
// returned it, with nested `plan`/`user`, would bounce with a 400.
export const cancelSubscription = async (
  subscription: Subscription,
): Promise<Subscription> => {
  return updateSubscription({
    id: subscription.id,
    userId: subscription.userId,
    planId: subscription.planId,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    state: 'cancelada',
  });
};

export const deleteSubscription = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/subscription/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, `Error al eliminar suscripción ${id}`),
      { cause: error },
    );
  }
};

export const restoreSubscription = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/subscription/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, `Error al restaurar suscripción ${id}`),
      { cause: error },
    );
  }
};
