

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse, RegisterUserData, Role } from "../types/user";
import {
  loginUser as loginRequest,
  registerUser as registerRequest,
  loginWithGoogleApi as loginWithGoogleRequest,
  logoutUser as clearSession,
  getStoredToken,
  getStoredUser,
} from "../services/auth.service";
import { decodeToken, isTokenExpired } from "../lib/jwt";

type AuthUser = AuthResponse["user"];

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: RegisterUserData) => Promise<AuthResponse>;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  logout: () => void;
  // Refresca los datos de perfil en memoria + localStorage tras un PATCH
  // /user/me exitoso, sin re-loguear (el rol no cambia en ese flujo).
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Lee token + user de localStorage. Si el token no está, es inválido o ya
// venció, la sesión se considera cerrada (y se limpia lo que haya quedado).
function resolveSession(): { user: AuthUser | null; role: Role | null } {
  const token = getStoredToken();
  if (!token) return { user: null, role: null };

  const payload = decodeToken(token);
  if (!payload || isTokenExpired(payload)) {
    clearSession();
    return { user: null, role: null };
  }

  // El rol sale del token (fuente de verdad, mismo claim que usa el backend);
  // el resto del perfil (nombre, etc.) sale del "user" guardado en el login.
  return { user: getStoredUser(), role: payload.role };
}


// Chequea que useAuth sea usado dentro de un <AuthProvider> 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = resolveSession();
    setUser(session.user);
    setRole(session.role);
    setIsLoading(false);
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
    setRole(data.user.role);
    return data;
  };

  const register: AuthContextValue["register"] = async (payload) => {
    const data = await registerRequest(payload);
    setUser(data.user);
    setRole(data.user.role);
    return data;
  };

  const loginWithGoogle: AuthContextValue["loginWithGoogle"] = async (idToken) => {
    const data = await loginWithGoogleRequest(idToken);
    setUser(data.user);
    setRole(data.user.role);
    return data;
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setRole(null);
  };

  const updateUser: AuthContextValue["updateUser"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const value: AuthContextValue = {
    user,
    role,
    isAuthenticated: !!user,
    isAdmin: role === "admin",
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value} >{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>.");
  }
  return ctx;
}