// Mirrors PLACEHOLDER_EMAIL_DOMAIN in the backend's user.rules.ts. A member
// created at the front desk with no email gets `<dni>@presencial.flg` so the
// NOT NULL column is satisfied; the admin panel shows "Sin email" for it
// instead of an address nobody can write to. The two constants must be
// changed together.
const PLACEHOLDER_EMAIL_DOMAIN = 'presencial.flg';

export const isPlaceholderEmail = (
  email: string | null | undefined,
): boolean =>
  !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
