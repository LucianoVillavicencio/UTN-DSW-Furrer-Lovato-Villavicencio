import { useState, type FormEvent } from "react";
import FormAlert from "../common/FormAlert";
import GoogleAuthButton from "../common/GoogleAuthButton";
import RegisterFieldsGroup from "./RegisterFieldsGroup";
import RegisterSubmitButton from "./RegisterSubmitButton";
import { registerUser } from "../../services/auth.service";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({ name, email, phone, password });
      setSuccess("¡Registro completado con éxito! Redirigiendo...");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar la cuenta";
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

      <RegisterFieldsGroup
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
      />

      <RegisterSubmitButton isLoading={isLoading} />

      {/* Divider */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-text-muted font-body">
          o bien
        </span>
      </div>

      <GoogleAuthButton label="Registrarse con Google" />

      <p className="text-center font-body text-sm text-text-muted pt-1">
        ¿Ya tienes una cuenta?{" "}
        <a href="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
          Inicia sesión aquí
        </a>
      </p>
    </form>
  );
};

export default RegisterForm;
