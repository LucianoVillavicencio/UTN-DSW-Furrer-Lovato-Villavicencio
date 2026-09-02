import { Transform } from 'class-transformer';
import { IsString, Matches, MinLength } from 'class-validator';

// Same policy as RegisterDto — a password chosen here is a permanent one.
export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una letra y un número.',
  })
  newPassword!: string;
}
