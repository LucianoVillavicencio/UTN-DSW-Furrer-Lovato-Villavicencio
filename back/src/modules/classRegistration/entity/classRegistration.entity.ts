import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../user/entity/users.entity';
import { ClassSession } from '../../classSession/entity/classSession.entity';

@Entity('class_registration')
export class ClassRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  userDni!: number;

  @ManyToOne(() => Users, { eager: true, nullable: false })
  @JoinColumn({ name: 'userDni' })
  user!: Users;

  @Column({ type: Number, nullable: false })
  classSessionId!: number;

  @ManyToOne(() => ClassSession, { eager: true, nullable: false })
  @JoinColumn({ name: 'classSessionId' })
  classSession!: ClassSession;

  @Column({ type: 'datetime', nullable: false })
  date!: Date;

  @Column({ type: String, nullable: false, default: 'confirmada' })
  state!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
