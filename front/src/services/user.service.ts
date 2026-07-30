import type { User } from '../types/user';

const API_URL = 'http://localhost:3000/api/v1/user';

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al obtener la lista de usuarios');
  }
  return await response.json();
};

export const getUserByDni = async (dni: number): Promise<User> => {
  const response = await fetch(`${API_URL}/${dni}`);
  if (!response.ok) {
    throw new Error(`Error al obtener usuario con DNI ${dni}`);
  }
  return await response.json();
};

export const updateUser = async (user: User): Promise<User> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar el usuario');
  }
  return await response.json();
};

export const deleteUser = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${dni}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Error al eliminar usuario con DNI ${dni}`);
  }
  return await response.json();
};

export const restoreUser = async (dni: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/restore/${dni}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error(`Error al restaurar usuario con DNI ${dni}`);
  }
  return await response.json();
};
