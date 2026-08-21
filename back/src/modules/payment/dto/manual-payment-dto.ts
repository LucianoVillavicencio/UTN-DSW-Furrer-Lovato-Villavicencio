import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

// Pago presencial cargado por un admin. subscriptionId identifica a QUIÉN
// se le cobra — nunca se acepta un userDni acá, así no hay forma de
// registrar un pago "a nombre de" alguien sin pasar por su suscripción real.
export class ManualPaymentDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  subscriptionId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsIn(['efectivo', 'debito', 'credito', 'transferencia'])
  payMethod!: string;
}
