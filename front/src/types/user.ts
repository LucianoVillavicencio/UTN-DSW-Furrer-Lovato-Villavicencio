export interface User {
  dni: number;
  email: string;
  name: string;
  surname: string;
  phone: string;
  password?: string;
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

export interface AuthResponse {
  message: string;
  user: Omit<User, 'password'>;
}
