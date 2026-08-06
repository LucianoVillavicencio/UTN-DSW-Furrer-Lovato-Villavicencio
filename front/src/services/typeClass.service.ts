import type { TypeClass } from "../types/typeClass";


const API_URL = "http://localhost:3000/api/v1/tipo-clase";

export const getTypeClass = async (): Promise<TypeClass[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener tipos de clase");
  }
  return await response.json();
};

export const getTypeClassById = async (id: number): Promise<TypeClass> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener tipo de clase ${id}`);
  }
  return await response.json();
};

export const createTypeClass = async (
  typeClass: TypeClass,
): Promise<TypeClass> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(typeClass),
  });
  if (!response.ok) {
    throw new Error("Error al crear tipo de clase");
  }
  return await response.json();
};

export const updateTypeClass = async (
  typeClass: TypeClass,
): Promise<TypeClass> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(typeClass),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar tipo de clase");
  }
  return await response.json();
};

export const deleteTypeClass = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar tipo de clase ${id}`);
  }
  return await response.json();
};

export const restoreTypeClass = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error(`Error al restaurar tipo de clase ${id}`);
  }
  return await response.json();
};

export const getTiposClase = getTypeClass;
export const getTipoClaseById = getTypeClassById;
export const createTipoClase = createTypeClass;
export const updateTipoClase = updateTypeClass;
export const deleteTipoClase = deleteTypeClass;

