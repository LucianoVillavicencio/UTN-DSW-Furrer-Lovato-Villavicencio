import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Suscripcion } from '../../suscripcion/entity/suscripcion.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: Number, nullable: false })
  suscripcionId!: number;

  @ManyToOne(() => Suscripcion, { eager: true, nullable: false })
  @JoinColumn({ name: 'suscripcionId' })
  suscripcion!: Suscripcion;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto!: number;

  @Column({ type: 'datetime', nullable: false })
  fechaPago!: Date;

  @Column({ type: String, nullable: false, length: 50 })
  metodoPago!: string;

  @Column({ type: String, nullable: false, default: 'completado' })
  estado!: string;

  @Column({ type: Boolean, nullable: false, default: false })
  deleted!: boolean;
}
