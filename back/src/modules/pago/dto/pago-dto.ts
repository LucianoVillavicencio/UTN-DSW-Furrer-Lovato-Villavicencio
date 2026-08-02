import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class PagoDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  suscripcionId!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  monto!: number;

  @IsDateString()
  @IsNotEmpty()
  fechaPago!: string;

  @IsString()
  @IsNotEmpty()
  metodoPago!: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
