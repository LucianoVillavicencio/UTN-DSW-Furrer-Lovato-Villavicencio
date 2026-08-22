import type { Trainer, TrainerWorkShift } from '../types/trainer';
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

interface TrainerPayload {
  dni: number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  speciality?: string;
  instagram?: string;
  certifications: string[];
  workSchedule: TrainerWorkShift[];
}

// The API runs ValidationPipe with forbidNonWhitelisted, so posting back the
// object GET returned — which carries photoUrl and classes — is a 400. Only the
// writable fields travel.
export const toTrainerPayload = (trainer: Trainer): TrainerPayload => ({
  dni: trainer.dni,
  name: trainer.name,
  surname: trainer.surname,
  email: trainer.email,
  phone: trainer.phone ?? undefined,
  speciality: trainer.speciality ?? undefined,
  instagram: trainer.instagram ?? undefined,
  certifications: trainer.certifications ?? [],
  workSchedule: trainer.workSchedule ?? [],
});

export const createTrainer = async (trainer: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.post<Trainer>(
      '/trainer',
      toTrainerPayload(trainer),
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al crear profesor'), {
      cause: error,
    });
  }
};

export const updateTrainer = async (trainer: Trainer): Promise<Trainer> => {
  try {
    const { data } = await api.put<Trainer>(
      '/trainer',
      toTrainerPayload(trainer),
    );
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

export const uploadTrainerPhoto = async (
  dni: number,
  file: File,
): Promise<Trainer> => {
  const body = new FormData();
  body.append('photo', file);

  try {
    const { data } = await api.post<Trainer>(`/trainer/${dni}/photo`, body, {
      // Cleared on purpose: the browser has to write the multipart boundary,
      // which it cannot do while the shared JSON default is in place.
      headers: { 'Content-Type': undefined },
    });
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al subir la foto del profesor ${dni}`),
      { cause: error },
    );
  }
};

export const deleteTrainerPhoto = async (
  dni: number,
): Promise<{ message: string }> => {
  try {
    const { data } = await api.delete<{ message: string }>(
      `/trainer/${dni}/photo`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        `Error al eliminar la foto del profesor ${dni}`,
      ),
      { cause: error },
    );
  }
};
