import { randomInt } from 'crypto';

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

// The alphabets omit every glyph that is misread when a password is written
// on a slip and typed back in later: i/l/1 and o/0. `randomInt` and not
// Math.random — this is a credential, not a nonce.
const PASSWORD_LETTERS = 'abcdefghjkmnpqrstuvwxyz';
const PASSWORD_DIGITS = '23456789';

const pickFrom = (alphabet: string): string =>
  alphabet[randomInt(alphabet.length)];

/**
 * A password for a member created at the front desk who did not supply one.
 * Four letters then four digits, which satisfies AdminCreateUserDto's
 * @MinLength(8) and @Matches(letter + digit) by construction.
 */
export const generateMemberPassword = (): string =>
  [
    ...Array.from({ length: 4 }, () => pickFrom(PASSWORD_LETTERS)),
    ...Array.from({ length: 4 }, () => pickFrom(PASSWORD_DIGITS)),
  ].join('');
