import type { Trainer } from '../../types/trainer';

// pendingFile (a newly picked photo) and shouldRemovePhoto (the admin
// clicked "Quitar") represent mutually exclusive intents and must never
// both be set when TrainerForm's submit handler runs its save logic —
// otherwise it uploads the new photo and then immediately deletes it.
export interface TrainerPhotoState {
  pendingFile: File | null;
  shouldRemovePhoto: boolean;
}

export const EMPTY_TRAINER_PHOTO_STATE: TrainerPhotoState = {
  pendingFile: null,
  shouldRemovePhoto: false,
};

// Picking a file after "Quitar" replaces the photo, so it must cancel the
// removal that "Quitar" queued.
export const pickTrainerPhoto = (
  state: TrainerPhotoState,
  file: File | null,
): TrainerPhotoState => ({
  pendingFile: file,
  shouldRemovePhoto: file ? false : state.shouldRemovePhoto,
});

export const removeTrainerPhoto = (): TrainerPhotoState => ({
  pendingFile: null,
  shouldRemovePhoto: true,
});

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
