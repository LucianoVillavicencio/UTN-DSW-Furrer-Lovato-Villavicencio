import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import PasswordField from '../common/PasswordField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import PasswordStrengthMeter from '../register/PasswordStrengthMeter';
import { resetPassword } from '../../services/auth.service';

interface ResetPasswordFormProps {
  token: string;
}

// Same policy the backend enforces (ResetPasswordDto).
const validatePassword = (password: string): string | null => {
  if (!password) return 'La contraseña es requerida.';
  if (password.length < 8)
    return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return 'La contraseña debe tener al menos una letra y un número.';
  return null;
};

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Once the password is changed, send the member to the login after a beat.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdError = validatePassword(password.trim());
    const matchError =
      password !== confirm ? 'Las contraseñas no coinciden.' : null;
    setPasswordError(pwdError);
    setConfirmError(matchError);
    if (pwdError || matchError) return;

    setIsLoading(true);
    try {
      setSuccess(await resetPassword(token, password.trim()));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo restablecer la contraseña.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <FormAlert type="success" message={success} />
        <Button href="/login" variant="primary" size="md" className="w-full">
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <FormAlert type="error" message={error} />

      <div>
        <PasswordField
          id="reset-password"
          name="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          disabled={isLoading}
          error={passwordError}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <PasswordField
        id="reset-password-confirm"
        name="confirmPassword"
        label="Repetir contraseña"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          if (confirmError) setConfirmError(null);
        }}
        disabled={isLoading}
        error={confirmError}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-background" />
          ) : (
            <Check className="h-5 w-5" />
          )}
          <span>Guardar contraseña</span>
        </span>
      </Button>

      <p className="pt-2 text-center font-body text-sm text-text-muted">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Pedir un enlace nuevo
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;
