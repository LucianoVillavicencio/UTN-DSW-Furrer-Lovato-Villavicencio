import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  dni!: number;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  surname!: string;

  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(8)
  password!: string;
}
