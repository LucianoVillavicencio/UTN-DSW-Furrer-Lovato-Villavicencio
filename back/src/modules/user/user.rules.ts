// A member created at the front desk may have no email at all, but
// `users.email` is NOT NULL and is the login identifier. A deterministic
// address derived from the DNI fills the column, is unique because the DNI is
// the primary key, and is recognizable so the admin panel can show "Sin email"
// instead of a fake address the staff might try to write to.
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
