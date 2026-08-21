import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Self-service: a diferencia de UsersDto, no trae dni ni role — esos los
// resuelve el controller desde el JWT (@ActiveUser), nunca desde el body.
export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  surname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // Solo obligatoria si se manda newPassword.
  @ValidateIf((dto: UpdateProfileDto) => !!dto.newPassword)
  @IsString()
  @MinLength(1)
  currentPassword?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8)
  @IsOptional()
  newPassword?: string;
}
