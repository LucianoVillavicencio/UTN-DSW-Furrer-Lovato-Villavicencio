import type { Class } from "../types/class";
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

export const getClass = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>("/class");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener lista de clases"), { cause: error });
  }
};

export const getClassById = async (id: number): Promise<Class> => {
  try {
    const { data } = await api.get<Class>(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener clase ${id}`), { cause: error });
  }
};

// Admin-only: requiere estar logueado como admin (interceptor de `api`
// adjunta el JWT automáticamente).
export const createClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.post<Class>("/class", clase);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al crear clase"), { cause: error });
  }
};

export const updateClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.put<Class>("/class", clase);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar clase"), { cause: error });
  }
};

export const deleteClass = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar clase ${id}`), { cause: error });
  }
};

export const restoreClass = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/class/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar clase ${id}`), { cause: error });
  }
};

export const getDeletedClasses = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>("/class/filter/deleted");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener clases eliminadas"), { cause: error });
  }
};
