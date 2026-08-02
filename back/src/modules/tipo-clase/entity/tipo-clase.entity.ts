import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipo_clases')
export class TipoClase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  nombre!: string;

  @Column({ type: String, nullable: true, length: 255 })
  descripcion?: string | null;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
