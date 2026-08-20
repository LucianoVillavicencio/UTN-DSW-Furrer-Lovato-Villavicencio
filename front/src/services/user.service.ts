import type { User, UpdateProfilePayload } from '../types/user';
import { AxiosError } from 'axios';
import api from './api';

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) return fallback;
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message;
  return backendMessage || fallback;
};

// Self-service.
export const updateMyProfile = async (
  payload: UpdateProfilePayload,
): Promise<Omit<User, 'password'>> => {
  try {
    const { data } = await api.patch<Omit<User, 'password'>>('/user/me', payload);
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'No se pudo actualizar tu perfil.'), { cause: error });
  }
};

// Todo lo demás en este archivo es admin-only (UserController está gateado
// con @Auth(Role.ADMIN) a nivel clase). Antes usaba fetch crudo sin el
// header Authorization, así que nunca hubiese funcionado una vez agregado
// el guard — se pasa a la instancia `api` para que el JWT viaje.
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data } = await api.get<User[]>('/user');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener la lista de usuarios'), { cause: error });
  }
};

export interface UserSearchQuery {
  dni?: number;
  email?: string;
  name?: string;
  surname?: string;
}

export const searchUsers = async (query: UserSearchQuery): Promise<User[]> => {
  try {
    const params: Record<string, string> = {};
    if (query.dni) params.dni = String(query.dni);
    if (query.email) params.email = query.email;
    if (query.name) params.name = query.name;
    if (query.surname) params.surname = query.surname;

    const { data } = await api.get<User[]>('/user/search', { params });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo buscar usuarios.'), { cause: error });
  }
};

export const getUserByDni = async (dni: number): Promise<User> => {
  try {
    const { data } = await api.get<User>(`/user/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al obtener usuario con DNI ${dni}`), { cause: error });
  }
};

export const updateUser = async (user: User): Promise<User> => {
  try {
    const { data } = await api.put<User>('/user', user);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el usuario'), { cause: error });
  }
};

export interface AdminUpdateUserPayload {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin';
}

// Edición por un admin (perfil + rol) — no toca password, ver back
// AdminUpdateUserDto para el porqué.
export const adminUpdateUser = async (
  dni: number,
  payload: AdminUpdateUserPayload,
): Promise<Omit<User, 'password'>> => {
  try {
    const { data } = await api.patch<Omit<User, 'password'>>(`/user/${dni}`, payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo actualizar el usuario.'), { cause: error });
  }
};

export const deleteUser = async (dni: number): Promise<boolean> => {
  try {
    const { data } = await api.delete(`/user/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al eliminar usuario con DNI ${dni}`), { cause: error });
  }
};

export const restoreUser = async (dni: number): Promise<boolean> => {
  try {
    const { data } = await api.patch(`/user/restore/${dni}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, `Error al restaurar usuario con DNI ${dni}`), { cause: error });
  }
};
