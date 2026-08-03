import type { Trainer } from "../types/trainer";


const API_URL = "http://localhost:3000/api/v1/trainer";

export const getTrainers = async (): Promise<Trainer[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener lista de profesores");
  }
  return await response.json();
};

export const getTrainerByDni = async (dni: number): Promise<Trainer> => {
  const response = await fetch(`${API_URL}/${dni}`);
  if (!response.ok) {
    throw new Error(`Error al obtener profesor con DNI ${dni}`);
  }
  return await response.json();
};

export const createTrainer = async (profesor: Trainer): Promise<Trainer> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profesor),
  });
  if (!response.ok) {
    throw new Error("Error al crear profesor");
  }
  return await response.json();
};

export const updateTrainer = async (profesor: Trainer): Promise<Trainer> => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profesor),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar profesor");
  }
  return await response.json();
};

export const deleteTrainer = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${dni}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Error al eliminar profesor con DNI ${dni}`);
  }
  return await response.json();
};

export const restoreTrainer = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${dni}`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error(`Error al restaurar profesor con DNI ${dni}`);
  }
  return await response.json();
};
