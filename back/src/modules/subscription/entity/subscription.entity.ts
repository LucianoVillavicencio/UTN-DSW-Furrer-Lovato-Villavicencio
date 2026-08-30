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
}
