import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planes')
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  nombre!: string;

  @Column({ type: String, nullable: true, length: 255 })
  descripcion?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio!: number;

  @Column({ type: Number, nullable: false })
  duracionDias!: number;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
