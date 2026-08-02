import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TipoClase } from '../../tipo-clase/entity/tipo-clase.entity';
import { Profesor } from '../../profesor/entity/profesor.entity';

@Entity('clases')
export class Clase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: String, nullable: false, length: 100 })
  nombre!: string;

  @Column({ type: String, nullable: true, length: 255 })
  descripcion?: string | null;

  @Column({ type: Number, nullable: false })
  tipoClaseId!: number;

  @ManyToOne(() => TipoClase, { eager: true, nullable: false })
  @JoinColumn({ name: 'tipoClaseId' })
  tipoClase!: TipoClase;

  @Column({ type: Number, nullable: false })
  profesorDni!: number;

  @ManyToOne(() => Profesor, { eager: true, nullable: false })
  @JoinColumn({ name: 'profesorDni' })
  profesor!: Profesor;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
