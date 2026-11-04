import type { Class } from '../types/class';
import api from './api';
import { getApiErrorMessage } from './api-error';

// Uses the shared `api` instance rather than fetch, so every request carries
// the JWT Authorization header and the interceptor clears the session on a 401.
// GET is public on the backend; POST/PUT/DELETE/PATCH require the ADMIN role.

// GET /class returns each class with its joined `typeClass` and `trainer`
// objects, and the edit form starts from that object. The backend validates
// the body with forbidNonWhitelisted, so sending those relations back makes
// PUT /class fail with "property typeClass should not exist". Only the ids
// are writable.
export const toClassPayload = (clase: Class) => ({
  id: clase.id,
  name: clase.name,
  description: clase.description,
  typeClassId: clase.typeClassId,
  trainerDni: clase.trainerDni,
  deleted: clase.deleted,
});

export const getClass = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>('/class');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener lista de clases'),
      { cause: error },
    );
  }
};

export const getClassById = async (id: number): Promise<Class> => {
  try {
    const { data } = await api.get<Class>(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Error al obtener clase ${id}`), {
      cause: error,
    });
  }
};

export const getDeletedClasses = async (): Promise<Class[]> => {
  try {
    const { data } = await api.get<Class[]>('/class/filter/deleted');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener las clases eliminadas'),
      { cause: error },
    );
  }
};

export const createClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.post<Class>('/class', toClassPayload(clase));
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al crear clase'), {
      cause: error,
    });
  }
};

export const updateClass = async (clase: Class): Promise<Class> => {
  try {
    const { data } = await api.put<Class>('/class', toClassPayload(clase));
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al actualizar clase'), {
      cause: error,
    });
  }
};

export const deleteClass = async (id: number): Promise<{ message: string }> => {
  try {
    const { data } = await api.delete<{ message: string }>(`/class/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al eliminar clase ${id}`),
      { cause: error },
    );
  }
};

export const restoreClass = async (
  id: number,
): Promise<{ message: string }> => {
  try {
    const { data } = await api.patch<{ message: string }>(
      `/class/restore/${id}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al restaurar clase ${id}`),
      { cause: error },
    );
  }
};
