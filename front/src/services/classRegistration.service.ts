import type {
  ClassRegistration,
  MyEnrollments,
} from '../types/classRegistration';
import api from './api';
import { getApiErrorMessage } from './api-error';

// Uses the shared `api` instance rather than raw fetch: the backend gates this
// controller behind a JWT, and a bare fetch sends no Authorization header, so
// every call here used to fail once the guard was added. It also keeps the base
// URL in one place instead of hardcoding localhost.

// ---------------------------------------------------------------- members
// The member's own enrollments. The DNI travels in the JWT, never in the body
// or the URL, so one member can never read or touch another's.

export const getMyEnrollments = async (): Promise<MyEnrollments> => {
  try {
    const { data } = await api.get<MyEnrollments>('/classRegistration/me');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener tus inscripciones'),
      { cause: error },
    );
  }
};

// Books a class at an hour: every weekly turno of that class at that hour.
export const enrollInClass = async (
  classId: number,
  startTime: string,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.post<MyEnrollments>(
      '/classRegistration/enroll',
      { classId, startTime },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al inscribirte'), {
      cause: error,
    });
  }
};

// Switches an enrollment to another class or hour. `group` says which one to
// replace, which only matters on a plan that allows several at a time.
export const changeMyClass = async (
  classId: number,
  startTime: string,
  group?: string,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.put<MyEnrollments>('/classRegistration/me', {
      classId,
      startTime,
      ...(group ? { group } : {}),
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Error al cambiar de clase'), {
      cause: error,
    });
  }
};

export const cancelEnrollment = async (
  group: string,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.delete<MyEnrollments>(
      `/classRegistration/enrollment/${group}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al cancelar la inscripción'),
      { cause: error },
    );
  }
};

// ------------------------------------------------------------------ admin

// What a member holds, viewed from the admin panel — same shape as
// getMyEnrollments, but for a member picked by an admin, not the caller.
export const getMemberEnrollments = async (
  userId: number,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.get<MyEnrollments>(
      `/classRegistration/admin/${userId}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al obtener las clases de ${userId}`),
      { cause: error },
    );
  }
};

// Changes (or creates, for a member with no class yet) a member's enrollment
// from the admin panel. Ignores the monthly change cap: a member who used
// both changes still has to be movable in person at the front desk.
export const changeMemberClass = async (
  userId: number,
  classId: number,
  startTime: string,
  group?: string,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.put<MyEnrollments>(
      `/classRegistration/admin/${userId}`,
      { classId, startTime, ...(group ? { group } : {}) },
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al cambiar la clase de ${userId}`),
      { cause: error },
    );
  }
};

export const cancelMemberEnrollment = async (
  userId: number,
  group: string,
): Promise<MyEnrollments> => {
  try {
    const { data } = await api.delete<MyEnrollments>(
      `/classRegistration/admin/${userId}/${group}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al cancelar la clase de ${userId}`),
      { cause: error },
    );
  }
};

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
