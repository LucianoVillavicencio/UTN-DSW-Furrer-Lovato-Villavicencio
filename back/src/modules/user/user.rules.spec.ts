import {
  findAdminCreateUserError,
  isPlaceholderEmail,
  placeholderEmailFor,
} from './user.rules';

describe('placeholderEmailFor', () => {
  it('derives a stand-in address from the dni', () => {
    expect(placeholderEmailFor(40123456)).toBe('40123456@presencial.flg');
  });
});

describe('isPlaceholderEmail', () => {
  it('recognizes a generated address', () => {
    expect(isPlaceholderEmail('40123456@presencial.flg')).toBe(true);
  });

  it('ignores case, because MySQL comparisons do too', () => {
    expect(isPlaceholderEmail('40123456@PRESENCIAL.FLG')).toBe(true);
  });

  it('leaves a real address alone', () => {
    expect(isPlaceholderEmail('rosa@gmail.com')).toBe(false);
  });

  it('treats a missing address as not a placeholder', () => {
    expect(isPlaceholderEmail(null)).toBe(false);
    expect(isPlaceholderEmail(undefined)).toBe(false);
    expect(isPlaceholderEmail('')).toBe(false);
  });
});

describe('findAdminCreateUserError', () => {
  it('accepts a member with neither email nor password', () => {
    expect(findAdminCreateUserError({})).toBeNull();
  });

  it('accepts a member with an email and no password', () => {
    expect(findAdminCreateUserError({ email: 'rosa@gmail.com' })).toBeNull();
  });

  it('accepts a member with both', () => {
    expect(
      findAdminCreateUserError({
        email: 'rosa@gmail.com',
        password: 'unaClave1',
      }),
    ).toBeNull();
  });

  it('rejects a password with no email, because there is nothing to log in with', () => {
    expect(findAdminCreateUserError({ password: 'unaClave1' })).toBe(
      'Para definir una contraseña el socio necesita un email.',
    );
  });

  it('treats a blank email as no email', () => {
    expect(
      findAdminCreateUserError({ email: '   ', password: 'unaClave1' }),
    ).toBe('Para definir una contraseña el socio necesita un email.');
  });
});
