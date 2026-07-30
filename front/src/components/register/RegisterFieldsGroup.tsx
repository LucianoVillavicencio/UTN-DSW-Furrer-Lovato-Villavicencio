import { User, Mail, Phone, IdCard } from "lucide-react";
import InputField from "../common/InputField";
import PasswordField from "../common/PasswordField";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

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
}: RegisterFieldsGroupProps) => {
  return (
    <div className="space-y-3">
      {/* DNI */}
      <InputField
        label="DNI"
        type="number"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        placeholder="12345678"
        required
        icon={<IdCard className="h-4 w-4" />}
      />

      {/* Name and Surname Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan"
          required
          icon={<User className="h-4 w-4" />}
        />
        <InputField
          label="Apellido"
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Pérez"
          required
          icon={<User className="h-4 w-4" />}
        />
      </div>

      <InputField
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        icon={<Mail className="h-4 w-4" />}
      />

      <InputField
        label="Teléfono"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+54 9 11 1234-5678"
        required
        icon={<Phone className="h-4 w-4" />}
      />

      {/* Password Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {/* Password Strength Indicator */}
      <PasswordStrengthMeter password={password} />
    </div>
  );
};

export default RegisterFieldsGroup;
