import type { CompleteProfilePayload } from '../../types/user';

// dni is a string because an empty number input reads back as NaN, which
// cannot be told apart from a typo. Same reasoning as new-member-wizard.ts.
export interface CompleteProfileForm {
  dni: string;
  phone: string;
}

export const EMPTY_COMPLETE_PROFILE_FORM: CompleteProfileForm = {
  dni: '',
  phone: '',
};

// `hasExistingDni` is true for a member who already has one — a walk-in
// account created at the front desk without a phone reaches this screen too,
// and only needs the phone. Their dni is shown read-only.
//
// Same checks the API runs, so the member sees the problem without a round
// trip. The API is still the authority: a dni another account holds can only
// be discovered there.
export const findCompleteProfileFormError = (
  form: CompleteProfileForm,
  hasExistingDni: boolean,
): string | null => {
  if (!hasExistingDni) {
    const dni = form.dni.trim();
    if (!dni) return 'El DNI es obligatorio.';
    if (!/^\d+$/.test(dni) || Number(dni) <= 0) {
      return 'El DNI tiene que ser un número entero.';
    }
  }

  const phone = form.phone.trim();
  if (!phone) return 'El teléfono es obligatorio.';
  if (phone.length < 6) return 'El teléfono no parece válido.';

  return null;
};

export const toCompleteProfilePayload = (
  form: CompleteProfileForm,
  hasExistingDni: boolean,
): CompleteProfilePayload => {
  const phone = form.phone.trim();

  return hasExistingDni
    ? { phone }
    : { dni: Number(form.dni.trim()), phone };
};
