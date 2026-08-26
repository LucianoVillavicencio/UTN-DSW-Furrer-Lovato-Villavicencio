import {
  findAdminCreateUserError,
  isPlaceholderEmail,
  isProfileComplete,
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

// A member is usable only once we hold the two things Google never gives us.
// Derived on read rather than stored, so an admin filling in a missing phone
// through the Users panel cannot leave a stale flag behind.
describe('isProfileComplete', () => {
  it('accepts a member with both dni and phone', () => {
    expect(isProfileComplete({ dni: 40123456, phone: '3411234567' })).toBe(true);
  });

  it('rejects a member with no dni', () => {
    expect(isProfileComplete({ dni: null, phone: '3411234567' })).toBe(false);
    expect(isProfileComplete({ phone: '3411234567' })).toBe(false);
  });

  it('rejects a member with no phone', () => {
    expect(isProfileComplete({ dni: 40123456, phone: null })).toBe(false);
    expect(isProfileComplete({ dni: 40123456 })).toBe(false);
  });

  it('rejects a phone that is only whitespace', () => {
    expect(isProfileComplete({ dni: 40123456, phone: '   ' })).toBe(false);
  });

  it('does not treat dni 0 as missing', () => {
    // `!user.dni` would call 0 absent. It is not a valid DNI, but rejecting it
    // is the DTO's job, not this function's — conflating the two hides bugs.
    expect(isProfileComplete({ dni: 0, phone: '3411234567' })).toBe(true);
  });
});
