import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface TrainerWorkShift {
  // 1 = Monday … 6 = Saturday, the same convention ClassSession uses.
  weekday: number;
  startTime: string;
  endTime: string;
}

// Not a column: the classes a trainer teaches are derived from the classes
// table on read, so the two can never disagree.
export interface TrainerClass {
  id: number;
  name: string;
}

@Entity('trainers')
export class Trainer {
  @PrimaryColumn({ type: 'int' })
  dni!: number;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: false, length: 100 })
  surname!: string;

  @Column({ type: String, nullable: false, length: 100 })
  email!: string;

  @Column({ type: String, nullable: true, length: 50 })
  phone?: string | null;

  @Column({ type: String, nullable: true, length: 100 })
  speciality?: string | null;

  @Column({ type: String, nullable: true, length: 100 })
  instagram?: string | null;

  @Column({ type: 'json', nullable: true })
  certifications?: string[] | null;

  @Column({ type: 'json', nullable: true })
  workSchedule?: TrainerWorkShift[] | null;

  // Root-relative, e.g. /uploads/trainers/30111222-1740000000.webp. Written
  // only by the photo endpoints, never by the ordinary update route.
  @Column({ type: String, nullable: true, length: 255 })
  photoUrl?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
