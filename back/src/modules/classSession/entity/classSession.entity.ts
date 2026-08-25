import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Class } from '../../class/entity/class.entity';

@Entity('class_session')
export class ClassSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  classId!: number;

  @ManyToOne(() => Class, { eager: true, nullable: false })
  @JoinColumn({ name: 'classId' })
  class!: Class;

  // A turno is a WEEKLY slot: "Funcional, Mondays at 08:00", valid every week
  // until an admin changes it. Members enroll once and keep the spot, so the
  // schedule is not a list of dates.
  // 1 = Monday … 6 = Saturday; the gym is closed on Sundays.
  @Column({ type: Number, nullable: false, default: 1 })
  weekday!: number;

  // MySQL 'time', read back as 'HH:MM:SS'.
  @Column({ type: 'time', nullable: false, default: '00:00:00' })
  startTime!: string;

  // Legacy: turnos used to be one-off dated rows. PlanService-style backfill in
  // ClassSessionService reads this into weekday/startTime and then clears it,
  // so a null here means "already migrated". Drop the column once every
  // database has run that.
  @Column({ type: 'datetime', nullable: true })
  dateTime?: Date | null;

  @Column({ type: Number, nullable: false })
  maxCapacity!: number;

  @Column({ type: Number, nullable: false })
  availableSpots!: number;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
