// src/routes/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/user";

interface ProtectedRouteProps {
  children: ReactNode;
  // Si se omite, alcanza con estar autenticado (cualquier rol).
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Evita un parpadeo/redirect prematuro mientras se lee localStorage
    // en el primer render.
    return null;
  }

  if (!isAuthenticated) {
    // Mismo patrón que ya usa LoginForm.tsx para volver a esta ruta
    // después de loguearse (location.state.from.pathname).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Un admin siempre pasa, sin importar qué rol pida la ruta —
  // mismo criterio que RolesGuard en el backend (Paso 1).
  if (requiredRole && role !== requiredRole && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;