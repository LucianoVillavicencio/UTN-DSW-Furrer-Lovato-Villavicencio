import type { Class } from "../types/class";

const API_URL = "http://localhost:3000/api/v1/class";

export const getClass = async (): Promise<Class[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener lista de clases");
  }
  return await response.json();
};

export const getClassById = async (id: number): Promise<Class> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener clase ${id}`);
  }
  return await response.json();
};

export const createClass = async (clase: Class): Promise<Class> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clase),
  });
  if (!response.ok) {
    throw new Error("Error al crear clase");
  }
  return await response.json();
};

export const updateClass = async (clase: Class): Promise<Class> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clase),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar clase");
  }
  return await response.json();
};

export const deleteClass = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar clase ${id}`);
  }
  return await response.json();
};

export const restoreClass = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error(`Error al restaurar clase ${id}`);
  }
  return await response.json();
};
