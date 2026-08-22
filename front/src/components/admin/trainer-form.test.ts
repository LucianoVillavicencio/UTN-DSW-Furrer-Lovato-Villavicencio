import { describe, expect, it } from 'vitest';
import { EMPTY_TRAINER_FORM, findTrainerFormError } from './trainer-form';

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
