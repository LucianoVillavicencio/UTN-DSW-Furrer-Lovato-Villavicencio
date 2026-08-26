import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subscription } from '../../subscription/entity/subscription.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  subscriptionId!: number;

  @ManyToOne(() => Subscription, { eager: true, nullable: false })
  @JoinColumn({ name: 'subscriptionId' })
  subscription!: Subscription;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount!: number;

  @Column({ type: 'datetime', nullable: false })
  date!: Date;

  @Column({ type: String, nullable: false, length: 50 })
  payMethod!: string;

  @Column({ type: String, nullable: false, default: 'completado' })
  state!: string;

  // Id of the admin who recorded the in-person payment. Null for payments
  // that will come from Mercado Pago later on, since nobody records those.
  @Column({ type: Number, nullable: true })
  registeredById?: number | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
