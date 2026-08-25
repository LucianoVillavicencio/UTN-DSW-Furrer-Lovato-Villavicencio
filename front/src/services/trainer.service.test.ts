import { describe, expect, it } from 'vitest';
import { toTrainerPayload } from './trainer.service';

import type { Trainer } from '../types/trainer';

const trainer: Trainer = {
  dni: 30111222,
  name: 'Ana',
  surname: 'Gómez',
  email: 'ana@gym.com',
  phone: '3415550000',
  speciality: 'Funcional',
  instagram: 'ana.fit',
  certifications: ['Profesora de Educación Física'],
  workSchedule: [{ weekday: 1, startTime: '08:00', endTime: '12:00' }],
  photoUrl: '/uploads/trainers/30111222-1.webp',
  classes: [{ id: 1, name: 'Funcional' }],
  deleted: false,
};

describe('toTrainerPayload', () => {
  it('drops the read-only fields the API would reject', () => {
    const payload = toTrainerPayload(trainer);
    expect(payload).not.toHaveProperty('photoUrl');
    expect(payload).not.toHaveProperty('classes');
    expect(payload).not.toHaveProperty('deleted');
  });

  it('keeps every writable field', () => {
    expect(toTrainerPayload(trainer)).toEqual({
      dni: 30111222,
      name: 'Ana',
      surname: 'Gómez',
      email: 'ana@gym.com',
      phone: '3415550000',
      speciality: 'Funcional',
      instagram: 'ana.fit',
      certifications: ['Profesora de Educación Física'],
      workSchedule: [{ weekday: 1, startTime: '08:00', endTime: '12:00' }],
    });
  });

  it('sends undefined rather than null for the optional strings', () => {
    const payload = toTrainerPayload({
      ...trainer,
      phone: null,
      speciality: null,
      instagram: null,
    });
    expect(payload.phone).toBeUndefined();
    expect(payload.speciality).toBeUndefined();
    expect(payload.instagram).toBeUndefined();
  });

  it('sends empty lists rather than null so a cleared field is saved', () => {
    const payload = toTrainerPayload({
      ...trainer,
      certifications: null,
      workSchedule: null,
    });
    expect(payload.certifications).toEqual([]);
    expect(payload.workSchedule).toEqual([]);
  });
});
