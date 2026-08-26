// A member created at the front desk may have no email at all, but
// `users.email` is NOT NULL and is the login identifier. A deterministic
// address derived from the DNI fills the column, is unique because `users.dni`
// carries a unique index, and is recognizable so the admin panel can show
// "Sin email" instead of a fake address the staff might try to write to.
//
// Still keyed on the DNI and not on the new `users.id`: the only caller is
// adminCreateUser, where the admin always types a real DNI, and the id is not
// known until after the insert.
export const PLACEHOLDER_EMAIL_DOMAIN = 'presencial.flg';

export const placeholderEmailFor = (dni: number): string =>
  `${dni}@${PLACEHOLDER_EMAIL_DOMAIN}`;

export const isPlaceholderEmail = (email: string | null | undefined): boolean =>
  !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);

// A password is only reachable through the login form, which asks for an
// email, so one without the other would be dead data.
export const findAdminCreateUserError = (input: {
  email?: string;
  password?: string;
}): string | null => {
  if (input.password?.trim() && !input.email?.trim()) {
    return 'Para definir una contraseña el socio necesita un email.';
  }
  return null;
};

// Just enough of a user row to answer the question. Taking a structural type
// rather than the Users entity keeps this file free of an entity import and
// lets a DTO or a JWT-shaped object be checked with the same function.
export interface ProfileCompletenessSource {
  dni?: number | null;
  phone?: string | null;
}

// A Google sign-in gives us neither of these, so an account born that way is
// incomplete until the member fills them in. `dni != null` rather than `!dni`
// on purpose: 0 is a bad DNI but it is present, and rejecting bad values is
// the DTO's job.
export const isProfileComplete = (user: ProfileCompletenessSource): boolean =>
  user.dni != null && !!user.phone?.trim();
