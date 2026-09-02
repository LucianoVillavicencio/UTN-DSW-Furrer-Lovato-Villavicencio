import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Plan } from './plan.entity';

// An optional longer commitment on a plan, priced on its own. A plan with no
// rows here is sold by the month exactly as before — the one-month case reads
// the Plan's own price and numDays and never appears in this table.
@Entity('plan_durations')
@Unique(['planId', 'months'])
export class PlanDuration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  planId!: number;

  // CASCADE is safe because plan deletion here is logical. It only fires if a
  // row is hard-deleted by hand, where orphaned durations are the worse end.
  @ManyToOne(() => Plan, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @Column({ type: Number, nullable: false })
  months!: number;

  // Stored rather than derived from months × 30, so the owner can price a
  // semester as 180 days or as 183 without the application arguing.
  @Column({ type: Number, nullable: false })
  numDays!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price!: number;

  // Retires a price without breaking the subscriptions sold at it. There is
  // deliberately no restore route: three fields are faster to retype than to
  // find in a deleted list, and this column exists for history, not for undo.
  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
