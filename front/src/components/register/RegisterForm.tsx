import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormAlert from '../common/FormAlert';
import GoogleAuthButton from '../common/GoogleAuthButton';
import RegisterFieldsGroup from './RegisterFieldsGroup';
import RegisterSubmitButton from './RegisterSubmitButton';
import { useAuth } from '../../context/useAuth';
import Checkbox from '../common/CheckBox';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface RegisterFormProps {
  // Lets an embedding flow (checkout) take over where the member lands next
  // instead of the default redirect home. Callers that don't pass it keep
  // the existing behavior unchanged.
  onSuccess?: () => void;
  // Forwarded to GoogleAuthButton. Callers that don't pass it keep the
  // existing behavior unchanged.
  onIncompleteProfile?: () => void;
}

const RegisterForm = ({
  onSuccess,
  onIncompleteProfile,
}: RegisterFormProps) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    let isValid = true;
    setError(null);

    // DNI check
    const cleanDni = dni.trim();
    const numericDni = Number(cleanDni);
    if (!cleanDni) {
      newErrors.dni = 'El DNI es requerido.';
      isValid = false;
    } else if (
      isNaN(numericDni) ||
      numericDni <= 0 ||
      cleanDni.length < 7 ||
      cleanDni.length > 8
    ) {
      newErrors.dni = 'El DNI tiene que tener 7 u 8 dígitos.';
      isValid = false;
    }

    // Name check
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido.';
      isValid = false;
    }

    // Surname check
    if (!surname.trim()) {
      newErrors.surname = 'El apellido es requerido.';
      isValid = false;
    }

    // Email check
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      newErrors.email = 'El correo electrónico es requerido.';
      isValid = false;
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      newErrors.email =
        'Ingresa un correo electrónico válido (ej. usuario@dominio.com).';
      isValid = false;
    }

    // Phone check
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      newErrors.phone = 'El teléfono es requerido.';
      isValid = false;
    } else if (cleanPhone.length < 6) {
      newErrors.phone = 'Ingresa un número de teléfono válido.';
      isValid = false;
    }

    // Password check: minimum 8, matching the backend RegisterDto.
    if (!password) {
      newErrors.password = 'La contraseña es requerida.';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
      isValid = false;
    }

    // Confirm password check
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }

    // Terms & Conditions check
    if (!acceptTerms) {
      setError(
        'Debes aceptar los términos y condiciones para crear tu cuenta.',
      );
      isValid = false;
    }

    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // register() from AuthContext persists the token/user and updates the
      // global state, so the Navbar reacts immediately without a refresh.
      await register({
        dni: Number(dni.trim()),
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      setSuccess(
        '¡Cuenta creada con éxito! Sesión iniciada. Redirigiendo al inicio...',
      );
      // An embedding flow (checkout) takes over navigation itself; the
      // default redirect-home-after-a-beat only applies to standalone use.
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar la cuenta.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <FormAlert type="error" message={error} />
      <FormAlert type="success" message={success} />

      <RegisterFieldsGroup
        dni={dni}
        setDni={(v) => {
          setDni(v);
          if (fieldErrors.dni)
            setFieldErrors((prev) => ({ ...prev, dni: null }));
        }}
        name={name}
        setName={(v) => {
          setName(v);
          if (fieldErrors.name)
            setFieldErrors((prev) => ({ ...prev, name: null }));
        }}
        surname={surname}
        setSurname={(v) => {
          setSurname(v);
          if (fieldErrors.surname)
            setFieldErrors((prev) => ({ ...prev, surname: null }));
        }}
        email={email}
        setEmail={(v) => {
          setEmail(v);
          if (fieldErrors.email)
            setFieldErrors((prev) => ({ ...prev, email: null }));
        }}
        phone={phone}
        setPhone={(v) => {
          setPhone(v);
          if (fieldErrors.phone)
            setFieldErrors((prev) => ({ ...prev, phone: null }));
        }}
        password={password}
        setPassword={(v) => {
          setPassword(v);
          if (fieldErrors.password)
            setFieldErrors((prev) => ({ ...prev, password: null }));
        }}
        confirmPassword={confirmPassword}
        setConfirmPassword={(v) => {
          setConfirmPassword(v);
          if (fieldErrors.confirmPassword)
            setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
        }}
        disabled={isLoading}
        errors={fieldErrors}
      />

      {/* Terms & Conditions Checkbox */}
      <Checkbox
        id="accept-terms"
        checked={acceptTerms}
        disabled={isLoading}
        onChange={(e) => setAcceptTerms(e.target.checked)}
        className="pt-1 text-xs"
        label={
          <>
            Acepto los{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              política de privacidad
            </Link>
            .
          </>
        }
      />

      <RegisterSubmitButton isLoading={isLoading} />

      {/* Divider */}
      <div className="relative mt-2 mb-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-text-muted font-body">
          o bien
        </span>
      </div>

      <GoogleAuthButton
        label="Registrarse con Google"
        text="signup_with"
        disabled={isLoading}
        onError={(errMsg) => setError(errMsg)}
        onSuccess={onSuccess}
        onIncompleteProfile={onIncompleteProfile}
      />

      <p className="text-center font-body text-sm text-text-muted pt-1">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Inicia sesión aquí
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
