import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import InputField from "../common/InputField";
import PasswordField from "../common/PasswordField";
import FormAlert from "../common/FormAlert";
import GoogleAuthButton from "../common/GoogleAuthButton";
import LoginSubmitButton from "./LoginSubmitButton";
import { loginUser } from "../../services/auth.service";

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(email, password);
      if (response && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      setSuccess("¡Inicio de sesión exitoso! Redirigiendo al inicio...");
      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message === "Failed to fetch" 
        ? "No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde." 
        : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <FormAlert type="error" message={error} />
      <FormAlert type="success" message={success} />

      <InputField
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        icon={<Mail className="h-4 w-4" />}
      />

      <PasswordField
        label="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text transition-colors">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background"
          />
          <span className="font-body text-xs sm:text-sm">Recordarme</span>
        </label>
        <a
          href="/forgot-password"
          className="font-body text-xs sm:text-sm text-primary hover:text-primary-hover font-semibold transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <LoginSubmitButton isLoading={isLoading} />

      {/* Divider */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-text-muted font-body">
          o bien
        </span>
      </div>

      {/* Google Login Button (Placed Below Email & Password) */}
      <GoogleAuthButton label="Continuar con Google" />

      <p className="text-center font-body text-sm text-text-muted pt-2">
        ¿No tienes una cuenta aún?{" "}
        <a href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
          Regístrate gratis
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
