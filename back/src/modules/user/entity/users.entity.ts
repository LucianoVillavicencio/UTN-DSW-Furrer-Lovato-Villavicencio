import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../../common/enum/role.enum';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  // No longer the primary key, and no longer invented for Google accounts:
  // null until the member types it into the completion screen. The unique
  // index tolerates any number of NULLs in MySQL, so "unique when present"
  // needs no application-level workaround — but the service still checks for a
  // duplicate first, so the member sees a Spanish 409 and not a driver error.
  @Column({ type: 'int', nullable: true, unique: true })
  dni?: number | null;

  // Unique index added along with this change: email is the login identifier
  // and uniqueness was previously enforced only by a service-layer lookup,
  // which is a race between two concurrent registrations.
  @Column({ type: String, nullable: false, length: 100, unique: true })
  email!: string;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: true, length: 100 })
  surname?: string | null;

  @Column({ type: String, nullable: true, length: 50 })
  phone?: string | null;

  @Column({ type: String, nullable: true, length: 255, select: false })
  password?: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ type: String, nullable: true, length: 100 })
  googleId?: string | null;

  @Column({ type: String, nullable: true })
  picture?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
