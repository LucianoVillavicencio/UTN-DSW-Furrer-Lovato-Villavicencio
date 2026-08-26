import { useState, type ReactNode } from 'react';
import type { Role } from '../types/user';
import {
  loginUser as loginRequest,
  registerUser as registerRequest,
  loginWithGoogleApi as loginWithGoogleRequest,
  completeProfileApi as completeProfileRequest,
  logoutUser as clearSession,
  getStoredToken,
  getStoredUser,
} from '../services/auth.service';
import { decodeToken, isTokenExpired } from '../lib/jwt';
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from './auth-context';

interface Session {
  user: AuthUser | null;
  role: Role | null;
}

// Reads token + user from localStorage. If the token is missing, malformed or
// already expired the session counts as closed, and whatever was left behind is
// cleared.
function resolveSession(): Session {
  const token = getStoredToken();
  if (!token) return { user: null, role: null };

  const payload = decodeToken(token);
  if (!payload || isTokenExpired(payload)) {
    clearSession();
    return { user: null, role: null };
  }

  // The role comes from the token — the source of truth, the same claim the
  // backend reads. The rest of the profile comes from the stored "user".
  return { user: getStoredUser(), role: payload.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Resolved during the first render instead of in an effect: reading
  // localStorage is synchronous, and doing it in an effect rendered one frame
  // of "logged out" before the real session landed.
  const [session, setSession] = useState<Session>(resolveSession);

  const login: AuthContextValue['login'] = async (email, password) => {
    const data = await loginRequest(email, password);
    setSession({ user: data.user, role: data.user.role });
    return data;
  };

  const register: AuthContextValue['register'] = async (payload) => {
    const data = await registerRequest(payload);
    setSession({ user: data.user, role: data.user.role });
    return data;
  };

  const loginWithGoogle: AuthContextValue['loginWithGoogle'] = async (
    idToken,
  ) => {
    const data = await loginWithGoogleRequest(idToken);
    setSession({ user: data.user, role: data.user.role });
    return data;
  };

  const completeProfile: AuthContextValue['completeProfile'] = async (
    payload,
  ) => {
    const data = await completeProfileRequest(payload);
    setSession({ user: data.user, role: data.user.role });
    return data;
  };

  const logout = () => {
    clearSession();
    setSession({ user: null, role: null });
  };

  const updateUser: AuthContextValue['updateUser'] = (patch) => {
    setSession((prev) => {
      if (!prev.user) return prev;
      const next = { ...prev.user, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return { ...prev, user: next };
    });
  };

  const value: AuthContextValue = {
    user: session.user,
    role: session.role,
    isAuthenticated: !!session.user,
    isAdmin: session.role === 'admin',
    // `=== true` rather than truthy: a stored user object from before this
    // field existed has no such property, and that must read as incomplete
    // rather than silently pass the gate.
    isProfileComplete: session.user?.profileComplete === true,
    login,
    register,
    loginWithGoogle,
    completeProfile,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
