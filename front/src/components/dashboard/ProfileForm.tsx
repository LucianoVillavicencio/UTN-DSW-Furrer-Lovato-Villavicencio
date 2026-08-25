import { useState, type FormEvent } from 'react';
import { Mail, Phone, User as UserIcon, ChevronDown } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import InputField from '../common/InputField';
import PasswordField from '../common/PasswordField';
import FormAlert from '../common/FormAlert';
import { useAuth } from '../../context/useAuth';
import { updateMyProfile } from '../../services/user.service';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ProfileForm = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );

  if (!user) return null;

  const isDirty =
    name !== user.name ||
    surname !== user.surname ||
    email !== user.email ||
    phone !== user.phone ||
    newPassword.length > 0;

  const validate = (): boolean => {
    const errors: Record<string, string | null> = {};

    if (!name.trim()) errors.name = 'El nombre es requerido.';
    if (!surname.trim()) errors.surname = 'El apellido es requerido.';
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Ingresá un correo electrónico válido.';
    }

    if (newPassword) {
      if (!currentPassword) {
        errors.currentPassword = 'Ingresá tu contraseña actual para cambiarla.';
      }
      if (newPassword.length < 8) {
        errors.newPassword =
          'La nueva contraseña debe tener al menos 8 caracteres.';
      }
      if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload: Parameters<typeof updateMyProfile>[0] = {};
      if (name !== user.name) payload.name = name.trim();
      if (surname !== user.surname) payload.surname = surname.trim();
      if (email !== user.email) payload.email = email.trim();
      if (phone !== user.phone) payload.phone = phone.trim();
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const updated = await updateMyProfile(payload);
      updateUser({
        name: updated.name,
        surname: updated.surname ?? undefined,
        email: updated.email,
        phone: updated.phone ?? undefined,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setSuccess('Tus datos se guardaron correctamente.');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar los cambios.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setSurname(user.surname ?? '');
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  return (
    <Card className="mx-auto w-full max-w-xl hover:translate-y-0 hover:shadow-lg">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-text">
            {name} {surname}
          </p>
          <p className="font-body text-sm text-text-muted">DNI {user.dni}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <FormAlert type="error" message={error} />
        <FormAlert type="success" message={success} />

        <InputField label="DNI" value={user.dni} disabled readOnly />
        <p className="-mt-3 text-xs text-text-muted">
          El DNI no puede modificarse.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Nombre"
            icon={<UserIcon className="h-4 w-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            disabled={isSaving}
          />
          <InputField
            label="Apellido"
            icon={<UserIcon className="h-4 w-4" />}
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            error={fieldErrors.surname}
            disabled={isSaving}
          />
        </div>

        <InputField
          label="Correo electrónico"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={isSaving}
        />

        <InputField
          label="Teléfono"
          icon={<Phone className="h-4 w-4" />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors.phone}
          disabled={isSaving}
        />

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowPasswordSection((prev) => !prev)}
            className="flex w-full items-center justify-between font-body text-sm font-semibold text-text"
          >
            Cambiar contraseña
            <ChevronDown
              className={`h-4 w-4 text-text-muted transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}
            />
          </button>

          {showPasswordSection && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-text-muted">
                Si tu cuenta inició sesión con Google, no vas a tener una
                contraseña local para cambiar.
              </p>
              <PasswordField
                id="current-password"
                name="currentPassword"
                label="Contraseña actual"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={fieldErrors.currentPassword}
                disabled={isSaving}
                required={false}
              />
              <PasswordField
                id="new-password"
                name="newPassword"
                label="Nueva contraseña"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={fieldErrors.newPassword}
                disabled={isSaving}
                required={false}
              />
              <PasswordField
                id="confirm-password"
                name="confirmPassword"
                label="Repetir nueva contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldErrors.confirmPassword}
                disabled={isSaving}
                required={false}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProfileForm;
