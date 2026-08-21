import type { Class } from "../types/class";
import api from "./api";
import { getApiErrorMessage } from "./api-error";

// Usa la instancia "api" (axios) en lugar de fetch: así cada request sale con
// el header Authorization del JWT y el interceptor limpia la sesión ante un 401.
// GET es público en el backend; POST/PUT/DELETE/PATCH exigen rol ADMIN.

export const getClass = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>("/class");
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al obtener lista de clases"), { cause: error });
  }
};

export const getClassById = async (id: number): Promise<Class> => {
  try {
    const { data } = await api.get<Class>(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al obtener clase ${id}`), { cause: error });
  }
};

export const getClassDeleted = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>("/class/filter/deleted");
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al obtener las clases eliminadas"), { cause: error });
  }
};

export const createClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.post<Class>("/class", clase);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al crear clase"), { cause: error });
  }
};

export const updateClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.put<Class>("/class", clase);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al actualizar clase"), { cause: error });
  }
};

export const deleteClass = async (id: number): Promise<{ message: string }> => {
  try {
    const { data } = await api.delete<{ message: string }>(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al eliminar clase ${id}`), { cause: error });
  }
};

export const restoreClass = async (id: number): Promise<{ message: string }> => {
  try {
    const { data } = await api.patch<{ message: string }>(`/class/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al restaurar clase ${id}`), { cause: error });
  }
};
