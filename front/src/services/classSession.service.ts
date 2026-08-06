import type { ClassSession } from "../types/classSession";

const API_URL = "http://localhost:3000/api/v1/classSession";

export const getClassSession = async (): Promise<ClassSession[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener turnos de clase");
  }
  return await response.json();
};

export const getClassSessionById = async (
  id: number,
): Promise<ClassSession> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener turno de clase ${id}`);
  }
  return await response.json();
};

export const createClassSession = async (
  classSession: ClassSession,
): Promise<ClassSession> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(classSession),
  });
  if (!response.ok) {
    throw new Error("Error al crear turno de clase");
  }
  return await response.json();
};

export const updateClassSession = async (
  classSession: ClassSession,
): Promise<ClassSession> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(classSession),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar turno de clase");
  }
  return await response.json();
};

export const deleteClassSession = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar turno de clase ${id}`);
  }
  return await response.json();
};

export const restoreClassSession = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${id}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error(`Error al restaurar turno de clase ${id}`);
  }
  return await response.json();
};

export const getTurnosClase = getClassSession;
export const getTurnoClaseById = getClassSessionById;
export const createTurnoClase = createClassSession;
export const updateTurnoClase = updateClassSession;
export const deleteTurnoClase = deleteClassSession;

