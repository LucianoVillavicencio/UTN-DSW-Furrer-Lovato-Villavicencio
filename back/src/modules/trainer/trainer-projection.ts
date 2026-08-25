import type { FindOptionsSelect } from 'typeorm';
import type { Trainer } from './entity/trainer.entity';

// The columns the public trainer directory is allowed to return. Anything not
// listed here — email, phone — stays behind admin-only reads: findTrainer()
// and findAllForAdmin() in trainer.service.ts, which keep returning the whole
// entity for the admin panel and the internal existence-check/merge logic.
//
// Lives in its own file (not trainer.service.ts, where the earlier draft of
// this fix put it) because class.service.ts also needs it to restrict the
// eagerly-joined trainer relation, and trainer.service.ts already imports
// ClassService — importing back from trainer.service.ts here would be a
// circular module dependency.
export const publicTrainerSelect: FindOptionsSelect<Trainer> = {
  dni: true,
  name: true,
  surname: true,
  speciality: true,
  instagram: true,
  certifications: true,
  workSchedule: true,
  photoUrl: true,
};
