import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { TurnoClase } from '../../turno-clase/entity/turno-clase.entity';

@Entity('inscripciones_clase')
export class InscripcionClase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  userDni!: number;

  @ManyToOne(() => Users, { eager: true, nullable: false })
  @JoinColumn({ name: 'userDni' })
  user!: Users;

  @Column({ type: Number, nullable: false })
  turnoClaseId!: number;

  @ManyToOne(() => TurnoClase, { eager: true, nullable: false })
  @JoinColumn({ name: 'turnoClaseId' })
  turnoClase!: TurnoClase;

  @Column({ type: 'datetime', nullable: false })
  fechaInscripcion!: Date;

  @Column({ type: String, nullable: false, default: 'confirmada' })
  estado!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
