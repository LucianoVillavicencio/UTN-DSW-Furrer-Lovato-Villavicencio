import { describe, expect, it } from 'vitest';
import {
  EMPTY_NEW_MEMBER_FORM,
  findNewMemberFormError,
  toAdminCreateUserPayload,
  type NewMemberForm,
} from './new-member-wizard';

const valid: NewMemberForm = {
  ...EMPTY_NEW_MEMBER_FORM,
  dni: '40123456',
  name: 'Rosa',
  surname: 'Gómez',
};

describe('findNewMemberFormError', () => {
  it('accepts a member with only dni, name and surname', () => {
    expect(findNewMemberFormError(valid)).toBeNull();
  });

  it('rejects a missing dni', () => {
    expect(findNewMemberFormError({ ...valid, dni: '  ' })).toBe(
      'El DNI es obligatorio.',
    );
  });

  it('rejects a dni that is not a positive whole number', () => {
    expect(findNewMemberFormError({ ...valid, dni: '40.12' })).toBe(
      'El DNI tiene que ser un número entero.',
    );
    expect(findNewMemberFormError({ ...valid, dni: '-5' })).toBe(
      'El DNI tiene que ser un número entero.',
    );
  });

  it('rejects a blank name or surname', () => {
    expect(findNewMemberFormError({ ...valid, name: '  ' })).toBe(
      'Nombre y apellido son obligatorios.',
    );
    expect(findNewMemberFormError({ ...valid, surname: '' })).toBe(
      'Nombre y apellido son obligatorios.',
    );
  });

  it('rejects an address that is not an email', () => {
    expect(findNewMemberFormError({ ...valid, email: 'rosa' })).toBe(
      'El email no parece válido.',
    );
  });

  it('rejects a password with no email', () => {
    expect(findNewMemberFormError({ ...valid, password: 'unaClave1' })).toBe(
      'Para definir una contraseña el socio necesita un email.',
    );
  });

  it('rejects a password under eight characters', () => {
    expect(
      findNewMemberFormError({
        ...valid,
        email: 'rosa@gmail.com',
        password: 'corta',
      }),
    ).toBe('La contraseña tiene que tener al menos 8 caracteres.');
  });
});

describe('toAdminCreateUserPayload', () => {
  it('omits every optional field left blank', () => {
    expect(toAdminCreateUserPayload(valid)).toEqual({
      dni: 40123456,
      name: 'Rosa',
      surname: 'Gómez',
    });
  });

  it('trims and includes the optional fields that were filled', () => {
    expect(
      toAdminCreateUserPayload({
        ...valid,
        phone: ' 341 555-1234 ',
        email: ' rosa@gmail.com ',
        password: 'unaClave1',
      }),
    ).toEqual({
      dni: 40123456,
      name: 'Rosa',
      surname: 'Gómez',
      phone: '341 555-1234',
      email: 'rosa@gmail.com',
      password: 'unaClave1',
    });
  });
});
