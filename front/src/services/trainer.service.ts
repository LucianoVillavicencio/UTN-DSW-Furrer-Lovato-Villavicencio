import type { Trainer } from '../types/trainer';
import api from './api';
import { getApiErrorMessage } from './api-error';

// Same approach as class.service.ts: axios with the JWT attached. The trainer
// listing is public; creating, updating and deleting require the ADMIN role.

export const getTrainers = async (): Promise<Trainer[]> => {
  try {
    const { data } = await api.get<Trainer[]>('/trainer');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener lista de profesores'),
      { cause: error },
    );
  }
};

export const getTrainerByDni = async (dni: number): Promise<Trainer> => {
  try {
    const { data } = await api.get<Trainer>(`/trainer/${dni}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al obtener profesor con DNI ${dni}`),
      { cause: error },
    );
  }
};

export const getDeletedTrainers = async (): Promise<Trainer[]> => {
  try {
    const { data } = await api.get<Trainer[]>('/trainer/filter/deleted');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener los profesores eliminados'),
      { cause: error },
    );
  }
};

export const createTrainer = async (profesor: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.post<Trainer>('/trainer', profesor);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al crear profesor'), {
      cause: error,
    });
  }
};

export const updateTrainer = async (profesor: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.put<Trainer>('/trainer', profesor);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al actualizar profesor'), {
      cause: error,
    });
  }
};

export const deleteTrainer = async (
  dni: number,
): Promise<{ message: string }> => {
  try {
    const { data } = await api.delete<{ message: string }>(`/trainer/${dni}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al eliminar profesor con DNI ${dni}`),
      { cause: error },
    );
  }
};

export const restoreTrainer = async (
  dni: number,
): Promise<{ message: string }> => {
  try {
    const { data } = await api.patch<{ message: string }>(
      `/trainer/restore/${dni}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al restaurar profesor con DNI ${dni}`),
      { cause: error },
    );
  }
};
