import type { Trainer } from "../types/trainer";
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

export const getTrainers = async (): Promise<Trainer[]> => {
  try {
    const { data } = await api.get<Trainer[]>("/trainer");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener lista de profesores"), { cause: error });
  }
};

export const getTrainerByDni = async (dni: number): Promise<Trainer> => {
  try {
    const { data } = await api.get<Trainer>(`/trainer/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener profesor con DNI ${dni}`), { cause: error });
  }
};

// Admin-only.
export const createTrainer = async (profesor: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.post<Trainer>("/trainer", profesor);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al crear profesor"), { cause: error });
  }
};

export const updateTrainer = async (profesor: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.put<Trainer>("/trainer", profesor);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar profesor"), { cause: error });
  }
};

export const deleteTrainer = async (dni: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/trainer/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar profesor con DNI ${dni}`), { cause: error });
  }
};

export const restoreTrainer = async (dni: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/trainer/restore/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar profesor con DNI ${dni}`), { cause: error });
  }
};

export const getDeletedTrainers = async (): Promise<Trainer[]> => {
  try {
    const { data } = await api.get<Trainer[]>("/trainer/filter/deleted");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener profesores eliminados"), { cause: error });
  }
};
