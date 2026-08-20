import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

// userDni nunca viaja acá: el controller lo resuelve desde el JWT
// (@ActiveUser), igual que UpdateProfileDto para /user/me.
export class ChangePlanDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId!: number;
}
