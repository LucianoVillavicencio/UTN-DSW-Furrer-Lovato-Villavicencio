import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Class } from '../../class/entity/class.entity';

@Entity('class_session')
export class ClassSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  classId!: number;

  @ManyToOne(() => Class, { eager: true, nullable: false })
  @JoinColumn({ name: 'classId' })
  class!: Class;

  @Column({ type: 'datetime', nullable: false })
  dateTime!: Date;

  @Column({ type: Number, nullable: false })
  maxCapacity!: number;

  @Column({ type: Number, nullable: false })
  availableSpots!: number;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
