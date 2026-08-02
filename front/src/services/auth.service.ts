import type { RegisterUserData, AuthResponse } from '../types/user';

const API_URL = 'http://localhost:3000/api/v1/user';

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Credenciales inválidas');
    }

    return data;
  } catch (error) {
    console.error("Error en el login:", error);
    throw error;
  }
};

export const registerUser = async (userData: RegisterUserData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      throw new Error(errorMsg || 'No se pudo registrar el usuario.');
    }

    return data;
  } catch (error) {
    console.error("Error en el registro:", error);
    throw error;
  }
};

export const loginWithGoogleApi = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la autenticación con Google');
    }

    return data;
  } catch (error) {
    console.error("Error en el login de Google:", error);
    throw error;
  }
};