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
  // Multer answers 413 when the upload is over the limit, and its own message
  // is in English.
  if (status === 413)
    return 'El archivo es demasiado grande. El máximo es 2 MB.';

  return (
    backendMessage || `Error del servidor (${status}). Inténtalo más tarde.`
  );
};

// The 403 CompleteProfileGuard throws, told apart from an ordinary
// authorization failure by its machine-readable code. The frontend redirects
// on this one instead of showing an error.
export const isProfileIncompleteError = (error: unknown): boolean =>
  error instanceof AxiosError &&
  error.response?.status === 403 &&
  (error.response.data as { code?: string } | undefined)?.code ===
    'PROFILE_INCOMPLETE';
