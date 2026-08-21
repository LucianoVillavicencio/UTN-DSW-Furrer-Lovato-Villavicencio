import type { Plan } from '../types/plan';
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

export const getPlans = async (): Promise<Plan[]> => {
  try {
    const { data } = await api.get<Plan[]>('/plan');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener lista de planes'), { cause: error });
  }
};

export const getPlanById = async (id: number): Promise<Plan> => {
  try {
    const { data } = await api.get<Plan>(`/plan/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener plan ${id}`), { cause: error });
  }
};

// Admin-only.
export const createPlan = async (plan: Plan): Promise<Plan> => {
  try {
    const { data } = await api.post<Plan>('/plan', plan);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear plan'), { cause: error });
  }
};

export const updatePlan = async (plan: Plan): Promise<Plan> => {
  try {
    const { data } = await api.put<Plan>('/plan', plan);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar plan'), { cause: error });
  }
};

export const deletePlan = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/plan/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar plan ${id}`), { cause: error });
  }
};

export const restorePlan = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/plan/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar plan ${id}`), { cause: error });
  }
};

export const getDeletedPlans = async (): Promise<Plan[]> => {
  try {
    const { data } = await api.get<Plan[]>('/plan/filter/deleted');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener planes eliminados'), { cause: error });
  }
};
