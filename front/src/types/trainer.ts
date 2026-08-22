// Mirrors back/src/modules/trainer/entity/trainer.entity.ts.
export interface TrainerWorkShift {
  // 1 = Monday … 6 = Saturday, the convention lib/weekday.ts already owns.
  weekday: number;
  startTime: string;
  endTime: string;
}

// Derived by the backend from the classes table; never sent back on a write.
export interface TrainerClass {
  id: number;
  name: string;
}

export interface Trainer {
  dni: number;
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  speciality?: string | null;
  instagram?: string | null;
  certifications?: string[] | null;
  workSchedule?: TrainerWorkShift[] | null;
  photoUrl?: string | null;
  classes?: TrainerClass[];
  deleted?: boolean;
}
