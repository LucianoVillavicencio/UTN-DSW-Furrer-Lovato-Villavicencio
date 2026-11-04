import { describe, expect, it } from 'vitest';
import { toClassPayload } from './class.service';

import type { Class } from '../types/class';

// What GET /class returns: the joined relations ride along with the ids.
const clase: Class = {
  id: 7,
  name: 'Funcional',
  description: 'Circuito de fuerza',
  typeClassId: 2,
  typeClass: { id: 2, name: 'Funcional' },
  trainerDni: 30111222,
  trainer: {
    dni: 30111222,
    name: 'Ana',
    surname: 'Gómez',
  } as Class['trainer'],
  deleted: false,
};

describe('toClassPayload', () => {
  it('drops the joined relations the API would reject', () => {
    const payload = toClassPayload(clase);
    expect(payload).not.toHaveProperty('typeClass');
    expect(payload).not.toHaveProperty('trainer');
  });

  it('keeps every writable field', () => {
    expect(toClassPayload(clase)).toEqual({
      id: 7,
      name: 'Funcional',
      description: 'Circuito de fuerza',
      typeClassId: 2,
      trainerDni: 30111222,
      deleted: false,
    });
  });

  it('sends the edited ids, not the ones of the stale joined objects', () => {
    const payload = toClassPayload({ ...clase, trainerDni: 40222333 });
    expect(payload.trainerDni).toBe(40222333);
  });
});
