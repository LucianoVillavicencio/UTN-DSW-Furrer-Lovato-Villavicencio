import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class UsersDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  dni!: number;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  surname!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @IsNotEmpty()
  deleted!: boolean;
}
