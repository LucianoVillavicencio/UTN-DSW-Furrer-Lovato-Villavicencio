import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('trainers')
export class Trainer {
  @PrimaryColumn({ type: 'int' })
  dni!: number;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: false, length: 100 })
  surname!: string;

  @Column({ type: String, nullable: false, length: 100 })
  email!: string;

  @Column({ type: String, nullable: true, length: 50 })
  phone?: string | null;

  @Column({ type: String, nullable: true, length: 100 })
  speciality?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
