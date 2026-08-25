import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trainer } from '../../trainer/entity/trainer.entity';
import { TypeClass } from '../../typeClass/entity/typeClass.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: true, length: 255 })
  description?: string | null;

  @Column({ type: Number, nullable: false })
  typeClassId!: number;

  @ManyToOne(() => TypeClass, { eager: true, nullable: false })
  @JoinColumn({ name: 'typeClassId' })
  typeClass!: TypeClass;

  @Column({ type: Number, nullable: false })
  trainerDni!: number;

  @ManyToOne(() => Trainer, { nullable: false })
  @JoinColumn({ name: 'trainerDni' })
  trainer!: Trainer;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
