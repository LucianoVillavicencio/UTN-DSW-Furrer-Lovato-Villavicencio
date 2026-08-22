import { describe, expect, it } from 'vitest';
import {
  EMPTY_TRAINER_FORM,
  EMPTY_TRAINER_PHOTO_STATE,
  findTrainerFormError,
  pickTrainerPhoto,
  removeTrainerPhoto,
} from './trainer-form';

import type { Trainer } from '../../types/trainer';

const valid: Trainer = {
  ...EMPTY_TRAINER_FORM,
  dni: 30111222,
  name: 'Ana',
  surname: 'Gómez',
  email: 'ana@gym.com',
};

describe('findTrainerFormError', () => {
  it('accepts a filled form', () => {
    expect(findTrainerFormError(valid)).toBeNull();
  });

  it('rejects a blank name, surname or email', () => {
    expect(findTrainerFormError({ ...valid, name: '  ' })).toBe(
      'Nombre, apellido y email son obligatorios.',
    );
  });

  it('rejects a missing dni', () => {
    expect(findTrainerFormError({ ...valid, dni: 0 })).toBe(
      'El DNI es obligatorio.',
    );
  });

  it('rejects a shift that ends before it starts', () => {
    expect(
      findTrainerFormError({
        ...valid,
        workSchedule: [{ weekday: 2, startTime: '18:00', endTime: '09:00' }],
      }),
    ).toBe('El horario del martes termina antes de empezar.');
  });

  it('rejects two shifts on the same weekday', () => {
    expect(
      findTrainerFormError({
        ...valid,
        workSchedule: [
          { weekday: 2, startTime: '08:00', endTime: '12:00' },
          { weekday: 2, startTime: '14:00', endTime: '18:00' },
        ],
      }),
    ).toBe('El horario tiene dos franjas para el martes.');
  });
});

describe('trainer photo state', () => {
  const file = new File(['x'], 'photo.png', { type: 'image/png' });

  it('starts with no pending file and no removal queued', () => {
    expect(EMPTY_TRAINER_PHOTO_STATE).toEqual({
      pendingFile: null,
      shouldRemovePhoto: false,
    });
  });

  it('queues a removal and clears any pending file', () => {
    const afterPick = pickTrainerPhoto(EMPTY_TRAINER_PHOTO_STATE, file);
    expect(removeTrainerPhoto()).toEqual({
      pendingFile: null,
      shouldRemovePhoto: true,
    });
    // Regardless of what was picked before, "Quitar" always wins.
    expect(pickTrainerPhoto(afterPick, null).pendingFile).toBe(null);
  });

  it('picking a new file after "Quitar" cancels the queued removal', () => {
    // Reproduces the Task 8 fix-round bug: Quitar -> pick a replacement
    // must not leave shouldRemovePhoto true, or the submit handler would
    // upload the new photo and then immediately delete it.
    const afterRemove = removeTrainerPhoto();
    const afterPick = pickTrainerPhoto(afterRemove, file);
    expect(afterPick).toEqual({ pendingFile: file, shouldRemovePhoto: false });
  });

  it('clearing the file picker (no Quitar involved) leaves removal untouched', () => {
    const afterPick = pickTrainerPhoto(EMPTY_TRAINER_PHOTO_STATE, null);
    expect(afterPick).toEqual({ pendingFile: null, shouldRemovePhoto: false });
  });
});
