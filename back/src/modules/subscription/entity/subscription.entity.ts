import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { Plan } from '../../plan/entity/plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  userId!: number;

  @ManyToOne(() => Users, { eager: true, nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;

  @Column({ type: Number, nullable: false })
  planId!: number;

  @ManyToOne(() => Plan, { eager: true, nullable: false })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @Column({ type: 'date', nullable: false })
  startDate!: Date;

  @Column({ type: 'date', nullable: false })
  endDate!: Date;

  @Column({ type: String, nullable: false, default: 'activa' })
  state!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;

  // Whether this membership charges itself when it is about to run out. Off by
  // default: a member opts in when they save a card, and switching it off must
  // never be harder than switching it on.
  @Column({ type: Boolean, nullable: false, default: false })
  autoRenew!: boolean;

  // When the current freeze began. Null unless state is PAUSED. The days owed
  // back are derived from this at unpause rather than accumulated, so a crash
  // between pause and unpause cannot lose or double-count them.
  @Column({ type: 'datetime', nullable: true })
  pausedAt!: Date | null;

  // The admin who froze the membership. No FK relation — same bare-column
  // pattern as Payment.registeredById elsewhere in this codebase.
  @Column({ type: Number, nullable: true })
  pausedById!: number | null;
}
