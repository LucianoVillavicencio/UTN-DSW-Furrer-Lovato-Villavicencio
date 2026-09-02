export type Role = 'user' | 'admin';

export interface User {
  // Sequential surrogate key. The dni was the primary key until 2026-08-26.
  id: number;
  // Null until the member supplies it — a Google sign-in cannot know it.
  dni: number | null;
  email: string;
  name: string;
  surname: string;
  phone: string;
  role: Role;
  password?: string;
  googleId?: string | null;
  picture?: string | null;
  deleted?: boolean;
}

export interface RegisterUserData {
  dni: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// authResponse carries only part of the user, so the type is picked from User
// rather than duplicated.

export interface AuthResponse {
  token: string;
  user: Pick<
    User,
    'id' | 'dni' | 'email' | 'name' | 'surname' | 'phone' | 'role'
  > & { profileComplete: boolean; mustChangePassword: boolean };
}

// The signed-in profile AuthContext exposes, as carried in the JWT.
export type AuthUser = AuthResponse['user'];

// Body of PATCH /user/me. The dni never travels here: the backend resolves it
// from the JWT.
export interface UpdateProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Body of POST /auth/complete-profile. The id never travels here: the backend
// resolves it from the JWT. `dni` is omitted by a member who already has one.
export interface CompleteProfilePayload {
  dni?: number;
  phone: string;
}

// Body of POST /auth/change-password.
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
