import type { TrainerClass, TrainerWorkShift } from './entity/trainer.entity';

// Admins paste whatever they copied: a handle, an @handle, or the full profile
// URL with Instagram's tracking query. Only the handle is stored, so the card
// can build the link itself.
export const normalizeInstagramHandle = (raw: string): string =>
  raw
    .trim()
    .split('?')[0]
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');

// Returns the value untouched when it is not an array, so @IsArray reports the
// real problem instead of this helper hiding it behind an empty list.
export const normalizeCertifications = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

// User-facing, so Spanish. Indexed by the 1..6 weekday the DTO already bounds.
const WEEKDAY_NAMES: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

// Returns the message to show, or null when the schedule is valid. Kept pure so
// the service decides which exception to throw.
export const findWorkScheduleError = (
  shifts: TrainerWorkShift[],
): string | null => {
  const seen = new Set<number>();

  for (const shift of shifts) {
    const day = WEEKDAY_NAMES[shift.weekday] ?? `día ${shift.weekday}`;

    if (seen.has(shift.weekday)) {
      return `El horario tiene dos franjas para el ${day}.`;
    }
    seen.add(shift.weekday);

    // 'HH:MM' is fixed-width and zero-padded, so string order is time order.
    if (shift.endTime <= shift.startTime) {
      return `El horario del ${day} termina antes de empezar.`;
    }
  }

  return null;
};

// Narrowed to what the card needs, so a change to the Class entity does not
// silently widen the public trainer payload.
export const toTrainerClasses = (
  classes: { id: number; name: string; trainerDni: number }[],
  dni: number,
): TrainerClass[] =>
  classes
    .filter((item) => item.trainerDni === dni)
    .map(({ id, name }) => ({ id, name }));
