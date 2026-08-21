import { AxiosError } from "axios";

// Forma en la que Nest devuelve errores (ValidationPipe, HttpException, etc.)
// Es la misma interfaz que usa auth.service.ts, acá centralizada para que los
// servicios de catálogo (class, trainer, typeClass) no repitan la traducción.
interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// Traduce cualquier error de axios en un mensaje para mostrar en pantalla.
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  if (!error.response) {
    // No hubo respuesta del servidor
    return "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
  }

  const { status } = error.response;
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(", ")
    : data?.message;

  // 401/403 llegan cuando el endpoint está protegido con @Auth(Role.ADMIN)
  // en el backend y el token no está, venció o el rol no alcanza.
  if (status === 401) return "Tu sesión expiró. Volvé a iniciar sesión para continuar.";
  if (status === 403) return "No tenés permisos para realizar esta acción.";
  if (status === 404) return backendMessage || "El recurso solicitado no existe.";
  if (status === 400) return backendMessage || "Datos inválidos.";
  if (status === 409) return backendMessage || "El recurso ya existe o está en un estado inválido.";

  return backendMessage || `Error del servidor (${status}). Inténtalo más tarde.`;
};
