import { Role } from '../enum/role.enum';
import type { Request } from 'express';

export interface UserActiveInterface {
  // The user's id. It carried the dni before the id became the primary key —
  // every call site passes it straight to a service, so the rename of the
  // surrounding parameters is what keeps that change visible.
  sub: number;
  email: string;
  role: Role;
  // Derived from the row at sign-in time, never stored. CompleteProfileGuard
  // reads it; POST /auth/complete-profile mints a fresh token to flip it.
  profileComplete: boolean;
}

// An Express request after AuthGuard has attached the verified JWT payload.
export type AuthenticatedRequest = Request & { user?: UserActiveInterface };
