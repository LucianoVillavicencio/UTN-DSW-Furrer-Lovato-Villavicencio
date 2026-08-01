import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginWithGoogleApi } from "../../services/auth.service";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface GoogleAuthButtonProps {
  label?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleAuthButton = ({
  label = "Continuar con Google",
  onSuccess,
  onError,
}: GoogleAuthButtonProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured =
    Boolean(clientId) &&
    clientId !== "your-google-client-id.apps.googleusercontent.com";

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      const msg = "No se recibió la credencial de Google.";
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await loginWithGoogleApi(credentialResponse.credential);
      if (response && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
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
    const msg = "La autenticación con Google ha fallado o fue cancelada.";
    setLocalError(msg);
    onError?.(msg);
  };

  if (!isConfigured) {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={() => {
            const msg =
              "Por favor configura tu GOOGLE_CLIENT_ID en los archivos .env del proyecto.";
            setLocalError(msg);
            onError?.(msg);
          }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-surface py-3.5 px-4 font-body text-sm font-semibold text-text hover:bg-surface-hover transition-all opacity-90 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          {label}
        </button>
        {localError && (
          <p className="text-xs text-amber-500 text-center font-body">
            {localError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      {loading ? (
        <div className="flex items-center justify-center py-2 text-sm text-text-muted font-body">
          Iniciando sesión con Google...
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            width="100%"
            text="continue_with"
          />
        </div>
      )}
      {localError && (
        <p className="text-xs text-red-500 text-center font-body">{localError}</p>
      )}
    </div>
  );
};


export default GoogleAuthButton;

