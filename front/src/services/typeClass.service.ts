import type { TypeClass } from "../types/typeClass";
import api from "./api";
import { getApiErrorMessage } from "./api-error";

// La ruta del backend es /api/v1/typeClass (ver TypeClassController).
// Se usa desde el filtro de disciplinas de la página de clases.

export const getTypeClass = async (): Promise<TypeClass[]> => {
  try {
    const { data } = await api.get<TypeClass[]>("/typeClass");
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al obtener tipos de clase"), { cause: error });
  }
};

export const getTypeClassById = async (id: number): Promise<TypeClass> => {
  try {
    const { data } = await api.get<TypeClass>(`/typeClass/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al obtener tipo de clase ${id}`), { cause: error });
  }
};

export const createTypeClass = async (typeClass: TypeClass): Promise<TypeClass> => {
  try {
    const { data } = await api.post<TypeClass>("/typeClass", typeClass);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al crear tipo de clase"), { cause: error });
  }
};

export const updateTypeClass = async (typeClass: TypeClass): Promise<TypeClass> => {
  try {
    const { data } = await api.put<TypeClass>("/typeClass", typeClass);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Error al actualizar tipo de clase"), { cause: error });
  }
};

export const deleteTypeClass = async (id: number): Promise<{ message: string }> => {
  try {
    const { data } = await api.delete<{ message: string }>(`/typeClass/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al eliminar tipo de clase ${id}`), { cause: error });
  }
};

export const restoreTypeClass = async (id: number): Promise<{ message: string }> => {
  try {
    const { data } = await api.patch<{ message: string }>(`/typeClass/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al restaurar tipo de clase ${id}`), { cause: error });
  }
};

export const getTiposClase = getTypeClass;
export const getTipoClaseById = getTypeClassById;
export const createTipoClase = createTypeClass;
export const updateTipoClase = updateTypeClass;
export const deleteTipoClase = deleteTypeClass;
