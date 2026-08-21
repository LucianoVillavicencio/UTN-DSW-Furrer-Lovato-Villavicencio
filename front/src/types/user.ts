

export type Role = "user" | "admin";


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


// Pick<User  : Construye un tipo nuevo tomando solo algunas propiedades de User.
// Lo usamos por que authResponse no trae todos lso campos de user

export interface AuthResponse {
  token: string;
  user: Pick<User, "dni" | "email" | "name" | "surname" | "phone" | "role">;
}

// Perfil del usuario logueado que expone el AuthContext (el que viaja en el JWT).
export type AuthUser = AuthResponse["user"];

// Body de PATCH /user/me. El dni nunca viaja acá: lo resuelve el backend
// desde el JWT.
export interface UpdateProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}
