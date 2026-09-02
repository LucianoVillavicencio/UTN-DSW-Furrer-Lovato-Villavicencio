import type { AdminCreateUserPayload } from '../../services/user.service';

// dni is a string because an empty number input reads back as NaN, which
// cannot be told apart from a typo.
export interface NewMemberForm {
  dni: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  password: string;
}

export const EMPTY_NEW_MEMBER_FORM: NewMemberForm = {
  dni: '',
  name: '',
  surname: '',
  phone: '',
  email: '',
  password: '',
};

export type WizardStep = 'datos' | 'plan' | 'clase' | 'cobro';

export const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: 'datos', label: 'Datos' },
  { id: 'plan', label: 'Plan' },
  { id: 'clase', label: 'Clase' },
  { id: 'cobro', label: 'Cobro' },
];

// Guards against a stale async plan-assignment callback overriding navigation
// that already happened while the request was in flight (see the Task 10 fix
// this pins).
export const nextStepAfterPlanAssigned = (current: WizardStep): WizardStep =>
  current === 'plan' ? 'clase' : current;

// Same checks the API runs, so the admin sees the problem without a round trip.
export const findNewMemberFormError = (form: NewMemberForm): string | null => {
  const dni = form.dni.trim();
  if (!dni) return 'El DNI es obligatorio.';
  if (!/^\d+$/.test(dni) || Number(dni) <= 0) {
    return 'El DNI tiene que ser un número entero.';
  }
  if (!form.name.trim() || !form.surname.trim()) {
    return 'Nombre y apellido son obligatorios.';
  }

  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'El email no parece válido.';
  }

  const password = form.password.trim();
  if (password && password.length < 8) {
    return 'La contraseña tiene que tener al menos 8 caracteres.';
  }

  return null;
};

// Optional fields are omitted, never sent empty: AdminCreateUserDto validates
// `email` with @IsEmail and `password` with @MinLength(8), so '' is a 400.
export const toAdminCreateUserPayload = (
  form: NewMemberForm,
): AdminCreateUserPayload => {
  const phone = form.phone.trim();
  const email = form.email.trim();
  const password = form.password.trim();

  return {
    dni: Number(form.dni.trim()),
    name: form.name.trim(),
    surname: form.surname.trim(),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(password ? { password } : {}),
  };
};
