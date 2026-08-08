import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength
} from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  surname!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
