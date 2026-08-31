import { IsBoolean } from 'class-validator';

// Whether to turn auto-renewal on or off, for the authenticated user's own
// active subscription. See subscription.controller.ts's setAutoRenew route:
// turning it ON is refused without an active, chargeable saved card; turning
// it OFF is always allowed.
export class SetAutoRenewDto {
  @IsBoolean()
  autoRenew!: boolean;
}
