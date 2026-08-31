import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { Plan } from '../../plan/entity/plan.entity';
import { PlanDuration } from '../../plan/entity/plan-duration.entity';

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

  // Which PlanDuration this subscription was sold at. Null means the plan's own
  // one-month price, which is every subscription written before this column
  // existed. Needed to compute MRR — a 12-month price divided by 12 — and to
  // label a subscription as "Premium — 6 meses" in the admin panel.
  //
  // Deliberately NOT eager, unlike `user` and `plan` above: a third eager
  // relation makes every joined payment row heavier still.
  @Column({ type: Number, nullable: true })
  planDurationId?: number | null;

  @ManyToOne(() => PlanDuration, { nullable: true })
  @JoinColumn({ name: 'planDurationId' })
  planDuration?: PlanDuration | null;

  // The price actually resolved and charged at the moment of sale — the
  // number the admin's checkout screen showed and the payment was recorded
  // against. Null means this subscription predates this column. This is
  // what MRR must read, not planDuration.price: a PlanDuration's price can
  // be changed later (retire the old row, add a new one at the same month
  // count — the only way the admin UI supports repricing a term), and a
  // live join would then silently rewrite what every already-sold
  // subscription is recorded as having cost.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  soldPrice?: number | null;
}
