import type { RegisterUserData, AuthResponse } from '../types/user';
import { AxiosError } from 'axios';
import api from './api'; // tu instancia de axios con baseURL: .../api/v1

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

// The shape Nest returns errors in (ValidationPipe, HttpException, ...).
interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// Turns any axios failure into a message that can be shown on screen.

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  if (!error.response) {
    // The server never answered.
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }

  const { status } = error.response;
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message;

  if (status === 401) return 'Correo electrónico o contraseña incorrectos.';
  if (status === 429)
    return 'Demasiadas solicitudes. Por favor, espera un momento.';
  if (status === 400) return backendMessage || 'Datos inválidos.';

  return (
    backendMessage || `Error del servidor (${status}). Inténtalo más tarde.`
  );
};

// Stores token + user only when the response actually carried them, without
// repeating this in each of the three functions that need it.
const persistSession = (data: AuthResponse) => {
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
};

// Login.
export const loginUser = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email: email.trim(),
      password,
    });

    persistSession(data);
    return data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(
        error,
        'Ocurrió un error inesperado durante el inicio de sesión.',
      ),
      { cause: error },
    );
  }
};

// Register.
export const registerUser = async (
  userData: RegisterUserData,
): Promise<AuthResponse> => {
  try {
    // POST /auth/register returns { token, user } just like login does.
    const { data } = await api.post<AuthResponse>('/auth/register', userData);

    persistSession(data);
    return data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(
        error,
        'Ocurrió un error inesperado durante el registro.',
      ),
      { cause: error },
    );
  }
};

// Google sign-in.
export const loginWithGoogleApi = async (
  idToken: string,
): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/google-login', {
      idToken,
    });

    persistSession(data);
    return data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(
        error,
        'Ocurrió un error inesperado con la autenticación de Google.',
      ),
      { cause: error },
    );
  }
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): AuthResponse['user'] | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse['user'];
  } catch {
    return null;
  }
};
