import { useState, type ChangeEvent } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import InputField from "./InputField";

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  autoComplete?: string;
  error?: string | null;
  className?: string;
}

const PasswordField = ({
  label = "Contraseña",
  value,
  onChange,
  placeholder = "••••••••",
  required = true,
  disabled = false,
  id = "password",
  name = "password",
  autoComplete = "current-password",
  error,
  className = "",
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputField
      id={id}
      name={name}
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      error={error}
      className={className}
      icon={<Lock className="h-4 w-4" />}
      rightElement={
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-text-muted hover:text-text focus:outline-none focus:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer p-1 rounded-lg"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
};

export default PasswordField;
