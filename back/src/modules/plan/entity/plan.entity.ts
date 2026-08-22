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

  // Shows the "Más popular" badge on the public plans page. It is a plain
  // flag per plan: the admin decides which ones carry it, and more than one
  // plan may be marked.
  @Column({ type: Boolean, nullable: false, default: false })
  highlighted!: boolean;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
