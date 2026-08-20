import type { TypeClass } from "../types/typeClass";
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

// Antes apuntaba a /tipo-clase, que no existe en el backend (el controller
// es /typeClass) — cualquier llamada de acá fallaba en silencio con 404.
export const getTypeClass = async (): Promise<TypeClass[]> => {
  try {
    const { data } = await api.get<TypeClass[]>("/typeClass");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener tipos de clase"), { cause: error });
  }
};

export const getTypeClassById = async (id: number): Promise<TypeClass> => {
  try {
    const { data } = await api.get<TypeClass>(`/typeClass/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener tipo de clase ${id}`), { cause: error });
  }
};

// Admin-only.
export const createTypeClass = async (typeClass: TypeClass): Promise<TypeClass> => {
  try {
    const { data } = await api.post<TypeClass>("/typeClass", typeClass);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al crear tipo de clase"), { cause: error });
  }
};

export const updateTypeClass = async (typeClass: TypeClass): Promise<TypeClass> => {
  try {
    const { data } = await api.put<TypeClass>("/typeClass", typeClass);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar tipo de clase"), { cause: error });
  }
};

export const deleteTypeClass = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/typeClass/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar tipo de clase ${id}`), { cause: error });
  }
};

export const restoreTypeClass = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/typeClass/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar tipo de clase ${id}`), { cause: error });
  }
};

export const getTiposClase = getTypeClass;
export const getTipoClaseById = getTypeClassById;
export const createTipoClase = createTypeClass;
export const updateTipoClase = updateTypeClass;
export const deleteTipoClase = deleteTypeClass;
