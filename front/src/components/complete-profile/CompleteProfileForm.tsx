import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, Phone } from 'lucide-react';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import { useAuth } from '../../context/useAuth';
import {
  EMPTY_COMPLETE_PROFILE_FORM,
  findCompleteProfileFormError,
  toCompleteProfilePayload,
  type CompleteProfileForm as FormValues,
} from './complete-profile';

const CompleteProfileForm = () => {
  const navigate = useNavigate();
  const { user, completeProfile, logout } = useAuth();

  const hasExistingDni = user?.dni != null;

  const [form, setForm] = useState<FormValues>({
    ...EMPTY_COMPLETE_PROFILE_FORM,
    dni: hasExistingDni ? String(user?.dni) : '',
    phone: user?.phone ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const formError = findCompleteProfileFormError(form, hasExistingDni);
    if (formError) {
      setError(formError);
      return;
    }

    setIsLoading(true);
    try {
      await completeProfile(toCompleteProfilePayload(form, hasExistingDni));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar tus datos.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <FormAlert type="error" message={error} />

      <InputField
        id="complete-profile-dni"
        name="dni"
        label="DNI"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        icon={<IdCard className="h-4 w-4" />}
        value={form.dni}
        // Write-once: a member who already has one cannot change it here.
        // Correcting it is an admin action.
        disabled={hasExistingDni || isLoading}
        onChange={(e) => setForm({ ...form, dni: e.target.value })}
        placeholder="40123456"
      />

      <InputField
        id="complete-profile-phone"
        name="phone"
        label="Teléfono"
        type="text"
        inputMode="tel"
        autoComplete="tel"
        icon={<Phone className="h-4 w-4" />}
        value={form.phone}
        disabled={isLoading}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder="3411234567"
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Guardando...' : 'Guardar y continuar'}
      </Button>

      {/* A member who cannot or will not finish must not be trapped here with
          no way out but clearing localStorage by hand. */}
      <button
        type="button"
        onClick={logout}
        className="w-full text-center font-body text-sm text-text-muted hover:text-text underline cursor-pointer transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  );
};

export default CompleteProfileForm;
