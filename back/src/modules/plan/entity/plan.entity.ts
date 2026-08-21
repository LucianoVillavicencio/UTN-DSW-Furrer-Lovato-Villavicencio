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

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
