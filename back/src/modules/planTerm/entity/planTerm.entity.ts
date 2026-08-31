import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Plan } from '../../plan/entity/plan.entity';
import { decimalTransformer } from '../../../common/decimal.transformer';

// A discounted multi-month purchase option for an existing Plan (e.g. "3
// months at a discount"). changePlan defaults to the plan's 1-month term when
// the caller does not pick one, so every plan is expected to carry one — see
// subscriptionService.changePlan.
@Entity('plan_terms')
export class PlanTerm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  planId!: number;

  @ManyToOne(() => Plan, { eager: true, nullable: false })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  // How many months this term covers (1-12, enforced in PlanTermService).
  // changePlan multiplies this by plan.numDays to get the subscription's
  // paid period.
  @Column({ type: Number, nullable: false })
  months!: number;

  // The TOTAL price for the whole term, NOT a per-month figure — a 3-month
  // term at a discount might be priced 2700 here, not 900. plan.price stays
  // the undiscounted monthly reference; this column is where the discount
  // actually lives.
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
