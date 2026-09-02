import { describe, expect, it } from 'vitest';
import {
  EMPTY_COMPLETE_PROFILE_FORM,
  EMPTY_PASSWORD_CHANGE_FORM,
  findCompleteProfileFormError,
  findPasswordChangeFormError,
  toChangePasswordPayload,
  toCompleteProfilePayload,
  type CompleteProfileForm,
  type PasswordChangeForm,
} from './complete-profile';

const valid: CompleteProfileForm = {
  dni: '40123456',
  phone: '3411234567',
};

describe('findCompleteProfileFormError', () => {
  it('accepts a filled form', () => {
    expect(findCompleteProfileFormError(valid, false)).toBeNull();
  });

  it('rejects a missing dni when the account has none', () => {
    expect(findCompleteProfileFormError({ ...valid, dni: '  ' }, false)).toBe(
      'El DNI es obligatorio.',
    );
  });

  it('rejects a dni that is not a positive whole number', () => {
    expect(findCompleteProfileFormError({ ...valid, dni: '40.12' }, false)).toBe(
      'El DNI tiene que ser un número entero.',
    );
    expect(findCompleteProfileFormError({ ...valid, dni: '-5' }, false)).toBe(
      'El DNI tiene que ser un número entero.',
    );
  });

  it('ignores the dni when the account already has one', () => {
    // A walk-in member reaching this screen only needs to add a phone; their
    // dni is shown read-only and never re-submitted.
    expect(findCompleteProfileFormError({ dni: '', phone: '3411234567' }, true)).toBeNull();
  });

  it('rejects a missing phone either way', () => {
    expect(findCompleteProfileFormError({ ...valid, phone: '  ' }, false)).toBe(
      'El teléfono es obligatorio.',
    );
    expect(findCompleteProfileFormError({ ...valid, phone: '  ' }, true)).toBe(
      'El teléfono es obligatorio.',
    );
  });

  it('rejects an implausibly short phone', () => {
    expect(findCompleteProfileFormError({ ...valid, phone: '123' }, false)).toBe(
      'El teléfono no parece válido.',
    );
  });

  it('starts empty', () => {
    expect(EMPTY_COMPLETE_PROFILE_FORM).toEqual({ dni: '', phone: '' });
  });
});

describe('toCompleteProfilePayload', () => {
  it('sends both fields for an account with no dni', () => {
    expect(toCompleteProfilePayload(valid, false)).toEqual({
      dni: 40123456,
      phone: '3411234567',
    });
  });

  it('omits the dni for an account that already has one', () => {
    // The backend would drop it anyway; not sending it keeps the write-once
    // rule visible on this side too.
    expect(toCompleteProfilePayload(valid, true)).toEqual({
      phone: '3411234567',
    });
  });

  it('trims the phone', () => {
    expect(
      toCompleteProfilePayload({ ...valid, phone: '  3411234567  ' }, true),
    ).toEqual({ phone: '3411234567' });
  });
});

const validPassword: PasswordChangeForm = {
  currentPassword: 'temporal123',
  newPassword: 'newpassword1',
  confirmPassword: 'newpassword1',
};

describe('findPasswordChangeFormError', () => {
  it('accepts a filled, matching form', () => {
    expect(findPasswordChangeFormError(validPassword)).toBeNull();
  });

  it('rejects a missing current password', () => {
    expect(
      findPasswordChangeFormError({ ...validPassword, currentPassword: '' }),
    ).toBe('Ingresá tu contraseña actual.');
  });

  it('rejects a new password shorter than 8 characters', () => {
    expect(
      findPasswordChangeFormError({
        ...validPassword,
        newPassword: 'short',
        confirmPassword: 'short',
      }),
    ).toBe('La nueva contraseña debe tener al menos 8 caracteres.');
  });

  it('rejects a confirmation that does not match', () => {
    expect(
      findPasswordChangeFormError({
        ...validPassword,
        confirmPassword: 'somethingelse1',
      }),
    ).toBe('Las contraseñas no coinciden.');
  });

  it('starts empty', () => {
    expect(EMPTY_PASSWORD_CHANGE_FORM).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });
});

describe('toChangePasswordPayload', () => {
  it('sends the current and new password, dropping the confirmation', () => {
    expect(toChangePasswordPayload(validPassword)).toEqual({
      currentPassword: 'temporal123',
      newPassword: 'newpassword1',
    });
  });
});
