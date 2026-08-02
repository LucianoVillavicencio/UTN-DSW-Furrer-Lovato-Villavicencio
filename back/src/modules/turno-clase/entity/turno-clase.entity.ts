import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Clase } from '../../clase/entity/clase.entity';

@Entity('turnos_clase')
export class TurnoClase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  claseId!: number;

  @ManyToOne(() => Clase, { eager: true, nullable: false })
  @JoinColumn({ name: 'claseId' })
  clase!: Clase;

  @Column({ type: 'datetime', nullable: false })
  fechaHora!: Date;

  @Column({ type: Number, nullable: false })
  cupoMaximo!: number;

  @Column({ type: Number, nullable: false })
  cupoDisponible!: number;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
