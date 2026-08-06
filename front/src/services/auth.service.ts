import type { RegisterUserData, AuthResponse } from '../types/user';

const API_URL = 'http://localhost:3000/api/v1/user';

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Correo electrónico o contraseña incorrectos.');
      }
      if (response.status === 429) {
        throw new Error('Demasiados intentos de inicio de sesión. Por favor, espera unos minutos e inténtalo de nuevo.');
      }
      if (response.status === 400) {
        const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(errorMsg || 'Datos de inicio de sesión inválidos.');
      }
      throw new Error(data.message || `Error del servidor (${response.status}). Inténtalo más tarde.`);
    }

    // Secure token and session storage
    if (data.token) {
      localStorage.setItem('accessToken', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.', { cause: error });
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Ocurrió un error inesperado durante el inicio de sesión.', { cause: error });
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Demasiadas solicitudes. Por favor, espera un momento.');
      }
      const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      throw new Error(errorMsg || 'No se pudo registrar el usuario.');
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.', { cause: error });
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Ocurrió un error inesperado durante el registro.', { cause: error });
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('La cuenta de Google no tiene acceso autorizado.');
      }
      throw new Error(data.message || 'Error en la autenticación con Google');
    }

    if (data.token) {
      localStorage.setItem('accessToken', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor para la autenticación de Google.', { cause: error });
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Ocurrió un error inesperado con la autenticación de Google.', { cause: error });
  }
};