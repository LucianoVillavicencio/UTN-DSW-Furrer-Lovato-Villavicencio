import { AxiosError } from 'axios';

// The shape Nest returns errors in (ValidationPipe, HttpException, ...).
// Centralised here so the catalogue services do not each repeat the
// translation.
interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// Turns any axios failure into a message that can be shown on screen.
export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
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

  // 401/403 arrive when the endpoint is guarded with @Auth(Role.ADMIN) and the
  // token is missing, expired, or the role is not enough.
  if (status === 401)
    return 'Tu sesión expiró. Volvé a iniciar sesión para continuar.';
  if (status === 403) return 'No tenés permisos para realizar esta acción.';
  if (status === 404)
    return backendMessage || 'El recurso solicitado no existe.';
  if (status === 400) return backendMessage || 'Datos inválidos.';
  if (status === 409)
    return (
      backendMessage || 'El recurso ya existe o está en un estado inválido.'
    );

  return (
    backendMessage || `Error del servidor (${status}). Inténtalo más tarde.`
  );
};
