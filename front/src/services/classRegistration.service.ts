import type { ClassRegistration } from '../types/classRegistration';
import api from './api';
import { getApiErrorMessage } from './api-error';

// Uses the shared `api` instance rather than raw fetch: the backend gates this
// controller behind a JWT, and a bare fetch sends no Authorization header, so
// every call here used to fail once the guard was added. It also keeps the base
// URL in one place instead of hardcoding localhost.

export const getClassRegistration = async (): Promise<ClassRegistration[]> => {
  try {
    const { data } = await api.get<ClassRegistration[]>('/classRegistration');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener inscripciones'),
      { cause: error },
    );
  }
};

export const getClassRegistrationById = async (
  id: number,
): Promise<ClassRegistration> => {
  try {
    const { data } = await api.get<ClassRegistration>(
      `/classRegistration/${id}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al obtener inscripción ${id}`),
      { cause: error },
    );
  }
};

export const createClassRegistration = async (
  registration: ClassRegistration,
): Promise<ClassRegistration> => {
  try {
    const { data } = await api.post<ClassRegistration>(
      '/classRegistration',
      registration,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al registrar inscripción'),
      { cause: error },
    );
  }
};

export const updateClassRegistration = async (
  registration: ClassRegistration,
): Promise<ClassRegistration> => {
  try {
    const { data } = await api.put<ClassRegistration>(
      '/classRegistration',
      registration,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al actualizar inscripción'),
      { cause: error },
    );
  }
};

export const deleteClassRegistration = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete<boolean>(`/classRegistration/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al eliminar inscripción ${id}`),
      { cause: error },
    );
  }
};

export const restoreClassRegistration = async (
  id: number,
): Promise<boolean> => {
  try {
    const { data } = await api.patch<boolean>(
      `/classRegistration/restore/${id}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al restaurar inscripción ${id}`),
      { cause: error },
    );
  }
};
