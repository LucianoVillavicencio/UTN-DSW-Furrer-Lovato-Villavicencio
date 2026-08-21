export type Role = 'user' | 'admin';

export interface User {
  dni: number;
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
  user: Pick<User, 'dni' | 'email' | 'name' | 'surname' | 'phone' | 'role'>;
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
