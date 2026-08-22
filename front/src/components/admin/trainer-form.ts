import type { Trainer } from '../../types/trainer';

export const EMPTY_TRAINER_FORM: Trainer = {
  dni: 0,
  name: '',
  surname: '',
  email: '',
  phone: '',
  speciality: '',
  instagram: '',
  certifications: [],
  workSchedule: [],
};

// User-facing, so Spanish. Mirrors WEEKDAY_NAMES in the backend's
// trainer.rules.ts: the admin should see the same wording either way.
const WEEKDAY_NAMES: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

// Same checks the API runs, so the admin sees the problem without a round trip.
export const findTrainerFormError = (form: Trainer): string | null => {
  if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
    return 'Nombre, apellido y email son obligatorios.';
  }
  if (!form.dni) {
    return 'El DNI es obligatorio.';
  }

  const seen = new Set<number>();
  for (const shift of form.workSchedule ?? []) {
    const day = WEEKDAY_NAMES[shift.weekday] ?? `día ${shift.weekday}`;
    if (seen.has(shift.weekday)) {
      return `El horario tiene dos franjas para el ${day}.`;
    }
    seen.add(shift.weekday);
    if (shift.endTime <= shift.startTime) {
      return `El horario del ${day} termina antes de empezar.`;
    }
  }

  return null;
};
