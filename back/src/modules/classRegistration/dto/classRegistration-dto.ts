import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ClassRegistrationDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  userDni!: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  classSessionId!: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}
