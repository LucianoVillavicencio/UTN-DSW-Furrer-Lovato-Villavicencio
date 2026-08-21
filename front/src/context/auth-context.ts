import { createContext } from 'react';
import type { AuthResponse, RegisterUserData, Role } from '../types/user';

export type AuthUser = AuthResponse['user'];

export interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: RegisterUserData) => Promise<AuthResponse>;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  logout: () => void;
  // Refreshes the in-memory and localStorage profile after a successful PATCH
  // /user/me, without logging in again — the role does not change in that flow.
  updateUser: (patch: Partial<AuthUser>) => void;
}

// The context and the hook live outside AuthContext.tsx so that the component
// file exports nothing but components, which is what Fast Refresh needs.
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
