import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { Role } from '../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  // When omitted, being authenticated is enough, whatever the role.
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isProfileComplete, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Same pattern LoginForm.tsx uses to come back to this route after signing
    // in (location.state.from.pathname).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // An incomplete account cannot do anything the API would allow anyway —
  // CompleteProfileGuard refuses it — so send them where they can fix it
  // rather than to a page that will only render errors.
  if (!isProfileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  // An admin always passes, whatever role the route asks for — the same rule
  // RolesGuard applies on the backend.
  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
