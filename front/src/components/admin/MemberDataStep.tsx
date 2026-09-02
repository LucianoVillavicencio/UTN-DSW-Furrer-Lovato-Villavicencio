import InputField from '../common/InputField';
import type { NewMemberForm } from './new-member-wizard';

interface MemberDataStepProps {
  form: NewMemberForm;
  onChange: (form: NewMemberForm) => void;
  disabled?: boolean;
}

const MemberDataStep = ({ form, onChange, disabled }: MemberDataStepProps) => (
  <div className="space-y-3">
    <InputField
      label="DNI *"
      inputMode="numeric"
      placeholder="Ej: 40123456"
      value={form.dni}
      disabled={disabled}
      onChange={(e) => onChange({ ...form, dni: e.target.value })}
    />
    <div className="grid gap-3 sm:grid-cols-2">
      <InputField
        label="Nombre *"
        value={form.name}
        disabled={disabled}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
      />
      <InputField
        label="Apellido *"
        value={form.surname}
        disabled={disabled}
        onChange={(e) => onChange({ ...form, surname: e.target.value })}
      />
    </div>
    <InputField
      label="Teléfono"
      placeholder="Ej: 341 555-1234"
      value={form.phone}
      disabled={disabled}
      onChange={(e) => onChange({ ...form, phone: e.target.value })}
    />
    <div>
      <InputField
        label="Email"
        type="email"
        placeholder="Opcional"
        value={form.email}
        disabled={disabled}
        onChange={(e) => onChange({ ...form, email: e.target.value })}
      />
      <p className="mt-1 text-xs text-text-muted">
        Si lo dejás vacío, el socio inicia sesión con su DNI.
      </p>
    </div>
    <div>
      <InputField
        label="Contraseña"
        type="password"
        placeholder="Opcional"
        autoComplete="new-password"
        value={form.password}
        disabled={disabled}
        onChange={(e) => onChange({ ...form, password: e.target.value })}
      />
      <p className="mt-1 text-xs text-text-muted">
        Si la dejás vacía, el sistema genera una y te la muestra para
        anotarla.
      </p>
    </div>
  </div>
);

export default MemberDataStep;
