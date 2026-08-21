import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

// userDni never travels in this body: the controller resolves it from the JWT
// (@ActiveUser), the same way UpdateProfileDto does for /user/me.
export class ChangePlanDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId!: number;
}
