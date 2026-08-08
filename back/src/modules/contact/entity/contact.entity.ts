import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../user/entity/users.entity';

@Entity('contact')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  surname!: string;
  
  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;

}