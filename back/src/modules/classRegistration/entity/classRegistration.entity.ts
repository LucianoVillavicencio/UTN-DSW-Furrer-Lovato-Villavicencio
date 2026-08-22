import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { ClassSession } from '../../classSession/entity/classSession.entity';

@Entity('class_registration')
export class ClassRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  userDni!: number;

  @ManyToOne(() => Users, { eager: true, nullable: false })
  @JoinColumn({ name: 'userDni' })
  user!: Users;

  @Column({ type: Number, nullable: false })
  classSessionId!: number;

  @ManyToOne(() => ClassSession, { eager: true, nullable: false })
  @JoinColumn({ name: 'classSessionId' })
  classSession!: ClassSession;

  @Column({ type: 'datetime', nullable: false })
  date!: Date;

  // A member enrolls in a class AT AN HOUR, which books every weekly turno of
  // that class at that hour (Funcional 08:00 → Monday, Wednesday and Friday).
  // Those rows share this id: it is what the member-facing endpoints speak in,
  // and what makes "one class" countable against the plan's allowance.
  @Column({ type: String, nullable: false, length: 36, default: '' })
  enrollmentGroup!: string;

  // True when this enrollment replaced another one. Counting the changes a
  // member has spent this month is then a single query instead of a guess from
  // the history.
  @Column({ type: Boolean, nullable: false, default: false })
  isChange!: boolean;

  // Set when the enrollment is cancelled, so cancelling and enrolling again can
  // be told apart from a first enrollment — both count as a change.
  @Column({ type: 'datetime', nullable: true })
  cancelledAt?: Date | null;

  @Column({ type: String, nullable: false, default: 'confirmada' })
  state!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
