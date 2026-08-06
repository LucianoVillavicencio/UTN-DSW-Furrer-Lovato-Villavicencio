import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('type_class')
export class TypeClass{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  name!: string;

  @Column({ type: String, nullable: true, length: 255 })
  description?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
