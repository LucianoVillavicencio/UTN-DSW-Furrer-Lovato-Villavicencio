import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Self-service: unlike UsersDto it carries no dni and no role — the controller
// resolves both from the JWT (@ActiveUser), never from the body.
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

  // Required only when newPassword is sent.
  @ValidateIf((dto: UpdateProfileDto) => !!dto.newPassword)
  @IsString()
  @MinLength(1)
  currentPassword?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8)
  @IsOptional()
  newPassword?: string;
}
