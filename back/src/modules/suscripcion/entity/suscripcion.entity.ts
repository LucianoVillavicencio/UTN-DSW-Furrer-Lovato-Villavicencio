import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { Plan } from '../../plan/entity/plan.entity';

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  userDni!: number;

  @ManyToOne(() => Users, { eager: true, nullable: false })
  @JoinColumn({ name: 'userDni' })
  user!: Users;

  @Column({ type: Number, nullable: false })
  planId!: number;

  @ManyToOne(() => Plan, { eager: true, nullable: false })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @Column({ type: 'date', nullable: false })
  fechaInicio!: Date;

  @Column({ type: 'date', nullable: false })
  fechaFin!: Date;

  @Column({ type: String, nullable: false, default: 'activa' })
  estado!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
