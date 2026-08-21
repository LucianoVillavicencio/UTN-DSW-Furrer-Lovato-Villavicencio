import { Role } from '../enum/role.enum';
import type { Request } from 'express';

export interface UserActiveInterface {
  sub: number;
  email: string;
  role: Role;
}

// An Express request after AuthGuard has attached the verified JWT payload.
export type AuthenticatedRequest = Request & { user?: UserActiveInterface };
