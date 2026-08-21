import { User, Mail, Phone, IdCard } from 'lucide-react';
import InputField from '../common/InputField';
import PasswordField from '../common/PasswordField';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface RegisterFieldsGroupProps {
  dni: string;
  setDni: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  surname: string;
  setSurname: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  disabled?: boolean;
  errors?: Record<string, string | null>;
}

const RegisterFieldsGroup = ({
  dni,
  setDni,
  name,
  setName,
  surname,
  setSurname,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  disabled = false,
  errors = {},
}: RegisterFieldsGroupProps) => {
  // Real-time password match calculation
  const isPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-3">
      {/* DNI */}
      <InputField
        id="reg-dni"
        name="dni"
        label="DNI"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        placeholder="12345678"
        required
        disabled={disabled}
        error={errors.dni}
        icon={<IdCard className="h-4 w-4" />}
      />

      {/* Name and Surname Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField
          id="reg-name"
          name="name"
          label="Nombre"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan"
          required
          disabled={disabled}
          error={errors.name}
          icon={<User className="h-4 w-4" />}
        />
        <InputField
          id="reg-surname"
          name="surname"
          label="Apellido"
          type="text"
          autoComplete="family-name"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Pérez"
          required
          disabled={disabled}
          error={errors.surname}
          icon={<User className="h-4 w-4" />}
        />
      </div>

      <InputField
        id="reg-email"
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        disabled={disabled}
        error={errors.email}
        icon={<Mail className="h-4 w-4" />}
      />

      <InputField
        id="reg-phone"
        name="phone"
        label="Teléfono / WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+54 9 11 1234-5678"
        required
        disabled={disabled}
        error={errors.phone}
        icon={<Phone className="h-4 w-4" />}
      />

      {/* Password Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          id="reg-password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          error={errors.password}
        />
        <PasswordField
          id="reg-confirm-password"
          name="confirmPassword"
          label="Confirmar contraseña"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={disabled}
          error={
            errors.confirmPassword ||
            (isPasswordMismatch ? 'Las contraseñas no coinciden.' : null)
          }
        />
      </div>

      {/* Password Strength Indicator */}
      <PasswordStrengthMeter password={password} />
    </div>
  );
};

export default RegisterFieldsGroup;
