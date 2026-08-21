import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enum/role.enum';

// Admin-side edit of a user (Users panel). It deliberately has no `password`:
// UsersDto, used by the older PUT /user, requires one on every update, which
// forces the caller to send something that ends up stored unhashed. This DTO
// closes that hole and sticks to the fields an admin actually needs.
export class AdminUpdateUserDto {
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

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
