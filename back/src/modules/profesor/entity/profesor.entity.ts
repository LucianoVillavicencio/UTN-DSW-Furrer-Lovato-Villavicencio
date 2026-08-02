import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('profesores')
export class Profesor {
  @PrimaryColumn({ type: 'int' })
  dni!: number;

  @Column({ type: String, nullable: false, length: 100 })
  nombre!: string;

  @Column({ type: String, nullable: false, length: 100 })
  apellido!: string;

  @Column({ type: String, nullable: false, length: 100 })
  email!: string;

  @Column({ type: String, nullable: true, length: 50 })
  telefono?: string | null;

  @Column({ type: String, nullable: true, length: 100 })
  especialidad?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
