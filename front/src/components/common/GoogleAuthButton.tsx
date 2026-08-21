import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// GSI solo llama a onError cuando Google contesta sin credencial. Si el flujo
// se corta antes (origen no autorizado, popup bloqueado por el navegador, una
// extension que rompe el handshake, o el usuario que cierra la ventana), no
// llama a nada: el boton queda mudo y la pantalla no muestra ningun error.
// Estos dos plazos convierten ese silencio en un mensaje.

// Backstop: hubo click pero nunca se abrio nada ni volvio respuesta.
const UNRESOLVED_TIMEOUT_MS = 45_000;
// El usuario volvio de la ventana de Google y la credencial nunca llego.
const RETURN_TIMEOUT_MS = 5_000;

interface GoogleAuthButtonProps {
  label?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleAuthButton = ({
  label = "Continuar con Google",
  disabled = false,
  onSuccess,
  onError,
}: GoogleAuthButtonProps) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // onError llega como arrow inline desde el form, asi que cambia en cada
  // render; el ref evita que los timers se queden con una version vieja.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const unresolvedTimerRef = useRef<number | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  // Hay un click esperando resolucion (exito, error o vencimiento).
  const awaitingRef = useRef(false);
  // La ventana perdio el foco, o sea que el popup de Google si llego a abrirse.
  const blurredRef = useRef(false);

  const clearPending = () => {
    if (unresolvedTimerRef.current !== null) {
      window.clearTimeout(unresolvedTimerRef.current);
      unresolvedTimerRef.current = null;
    }
    if (returnTimerRef.current !== null) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    awaitingRef.current = false;
    blurredRef.current = false;
  };

  // Es una heuristica, no un diagnostico: no sabemos por que se corto el flujo,
  // solo que no contesto. Por eso el mensaje sugiere reintentar en vez de
  // afirmar una causa.
  const reportUnresolvedFlow = () => {
    if (!awaitingRef.current) return;
    clearPending();
    const msg =
      "No se pudo completar el inicio de sesión con Google. Intentá de nuevo o ingresá con tu email y contraseña.";
    setLocalError(msg);
    onErrorRef.current?.(msg);
  };

  const handleGoogleClick = () => {
    setLocalError(null);
    // Si ya hay un click sin resolver no reiniciamos el backstop: alguien
    // clickeando repetidamente sobre un boton muerto lo postergaria para siempre.
    if (awaitingRef.current) return;
    awaitingRef.current = true;
    blurredRef.current = false;
    unresolvedTimerRef.current = window.setTimeout(
      reportUnresolvedFlow,
      UNRESOLVED_TIMEOUT_MS,
    );
  };

  useEffect(() => {
    const handleBlur = () => {
      if (awaitingRef.current) blurredRef.current = true;
    };

    // Solo cuenta como "volvio sin credencial" si antes hubo popup. Con FedCM
    // el selector de cuentas es UI del navegador y la pagina nunca pierde el
    // foco, asi que en ese caso queda solo el backstop largo.
    const handleFocus = () => {
      if (!awaitingRef.current || !blurredRef.current) return;
      if (returnTimerRef.current !== null) return;
      returnTimerRef.current = window.setTimeout(
        reportUnresolvedFlow,
        RETURN_TIMEOUT_MS,
      );
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured =
    Boolean(clientId) &&
    clientId !== "your-google-client-id.apps.googleusercontent.com";

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    clearPending();

    if (!credentialResponse.credential) {
      const msg = "No se recibió la credencial de Google.";
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // loginWithGoogle (AuthContext) ya persiste token+user en localStorage
      // Y actualiza el estado global (Navbar, etc. se enteran sin recargar).
      await loginWithGoogle(credentialResponse.credential);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al iniciar sesión con Google";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    clearPending();
    const msg = "La autenticación con Google ha fallado o fue cancelada por el usuario.";
    setLocalError(msg);
    onError?.(msg);
  };

  if (!isConfigured) {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => {
            const msg =
              "Por favor configura tu GOOGLE_CLIENT_ID en el archivo .env de la aplicación.";
            setLocalError(msg);
            onError?.(msg);
          }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 py-3 px-4 font-body text-sm font-semibold text-text shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{label}</span>
        </button>
        {!onError && localError && (
          <p className="text-xs text-amber-400 text-center font-body animate-fadeIn">
            {localError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      {loading ? (
        <div className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-surface text-sm text-text-muted font-body gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Iniciando sesión con Google...</span>
        </div>
      ) : (
        <div className={`w-full flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            click_listener={handleGoogleClick}
            theme="outline"
            size="large"
            width="320"
            text="continue_with"
          />
        </div>
      )}
      {/* Si el padre recibe onError ya muestra el mensaje (FormAlert); solo lo
          pintamos aca cuando el boton se usa suelto, sin nadie que lo reporte. */}
      {!onError && localError && (
        <p className="text-xs text-red-400 text-center font-body animate-fadeIn">{localError}</p>
      )}
    </div>
  );
};

export default GoogleAuthButton;