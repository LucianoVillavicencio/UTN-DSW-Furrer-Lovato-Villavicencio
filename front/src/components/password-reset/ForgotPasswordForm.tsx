import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import { requestPasswordReset } from '../../services/auth.service';

// Same client-side check as LoginForm.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('El correo electrónico es requerido.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setEmailError(
        'Ingresa un correo electrónico válido (ej. usuario@dominio.com).',
      );
      return;
    }

    setIsLoading(true);
    try {
      setSuccess(await requestPasswordReset(cleanEmail));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el enlace de recuperación.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <FormAlert type="error" message={error} />
      <FormAlert type="success" message={success} />

      <InputField
        id="forgot-email"
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError(null);
        }}
        placeholder="tu@email.com"
        required
        disabled={isLoading}
        error={emailError}
        icon={<Mail className="h-4 w-4" />}
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
            <Send className="h-5 w-5" />
          )}
          <span>{success ? 'Reenviar enlace' : 'Enviar enlace'}</span>
        </span>
      </Button>

      <p className="pt-2 text-center font-body text-sm text-text-muted">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
