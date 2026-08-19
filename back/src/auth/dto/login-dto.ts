import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";


export class LoginDto {

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Transform(({value}) => value.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}