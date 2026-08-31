import { IsNotEmpty, IsString } from 'class-validator';

// The member's email never travels in this body: the controller resolves it
// from the JWT (@ActiveUser), same reason ChangePlanDto never accepts userId
// — a client could otherwise register a card under an arbitrary email.
export class SaveCardDto {
  @IsString()
  @IsNotEmpty()
  cardToken!: string;
}
