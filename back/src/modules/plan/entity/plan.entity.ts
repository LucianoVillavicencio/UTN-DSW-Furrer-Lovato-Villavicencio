import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface PlanFeature {
  label: string;
  available: boolean;
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: true, length: 255 })
  description?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price!: number;

  @Column({ type: Number, nullable: false })
  numDays!: number;

  @Column({ type: 'json', nullable: true })
  features?: PlanFeature[] | null;

  // How many classes the plan includes: 0 = none, N = up to N different
  // classes at the same time, null = unlimited. Nullable rather than a
  // sentinel number so "unlimited" cannot be confused with a real allowance.
  @Column({ type: Number, nullable: true, default: 0 })
  maxClasses?: number | null;

  // Shows the "Más popular" badge on the public plans page. It is a plain
  // flag per plan: the admin decides which ones carry it, and more than one
  // plan may be marked.
  @Column({ type: Boolean, nullable: false, default: false })
  highlighted!: boolean;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
