import type { ClassSession } from '../types/classSession';
import api from './api';
import { getApiErrorMessage } from './api-error';

// Uses the shared `api` instance so the JWT travels: reading sessions is public,
// but creating, updating, deleting and restoring them require the ADMIN role.

export const getClassSession = async (): Promise<ClassSession[]> => {
  try {
    const { data } = await api.get<ClassSession[]>('/classSession');
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al obtener turnos'), {
      cause: error,
    });
  }
};

export const getDeletedClassSessions = async (): Promise<ClassSession[]> => {
  try {
    const { data } = await api.get<ClassSession[]>(
      '/classSession/filter/deleted',
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener turnos eliminados'),
      { cause: error },
    );
  }
};

export const getClassSessionById = async (
  id: number,
): Promise<ClassSession> => {
  try {
    const { data } = await api.get<ClassSession>(`/classSession/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al obtener turno ${id}`), {
      cause: error,
    });
  }
};

export const createClassSession = async (
  classSession: ClassSession,
): Promise<ClassSession> => {
  try {
    const { data } = await api.post<ClassSession>(
      '/classSession',
      classSession,
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al crear el turno'), {
      cause: error,
    });
  }
};

export const updateClassSession = async (
  classSession: ClassSession,
): Promise<ClassSession> => {
  try {
    const { data } = await api.put<ClassSession>('/classSession', classSession);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al actualizar el turno'), {
      cause: error,
    });
  }
};

export const deleteClassSession = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.delete<boolean>(`/classSession/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al eliminar turno ${id}`),
      {
        cause: error,
      },
    );
  }
};

export const restoreClassSession = async (id: number): Promise<boolean> => {
  try {
    const { data } = await api.patch<boolean>(`/classSession/restore/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al restaurar turno ${id}`),
      { cause: error },
    );
  }
};
