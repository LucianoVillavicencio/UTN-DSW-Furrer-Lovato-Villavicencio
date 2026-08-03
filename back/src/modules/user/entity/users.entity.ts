import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryColumn({ type: 'int' })
  dni!: number;

  @Column({ type: String, nullable: false, length: 100 })
  email!: string;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: true, length: 100 })
  surname?: string | null;

  @Column({ type: String, nullable: true, length: 50 })
  phone?: string | null;

  @Column({ type: String, nullable: true, length: 255 })
  password?: string | null;

  @Column({ type: String, nullable: true, length: 100 })
  googleId?: string | null;

  @Column({ type: String, nullable: true })
  picture?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
