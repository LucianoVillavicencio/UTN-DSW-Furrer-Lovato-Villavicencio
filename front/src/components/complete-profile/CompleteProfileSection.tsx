import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Container from '../common/Container';
import Card from '../common/Card';
import CompleteProfileForm from './CompleteProfileForm';
import { useAuth } from '../../context/useAuth';

// Deliberately NOT wrapped in ProtectedRoute — that component is what
// redirects *to* here, so wrapping this one would loop. It does its own two
// checks instead, and the second is what makes the screen appear exactly once.
const CompleteProfileSection = () => {
  const { isAuthenticated, isProfileComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container className="py-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <Card className="p-6 sm:p-10">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
              Completá tu perfil
            </h1>
            <p className="mt-2 font-body text-sm text-text-muted">
              Necesitamos tu DNI y tu teléfono para terminar de registrarte.
              Solo te lo vamos a pedir esta vez.
            </p>
          </div>

          <CompleteProfileForm />
        </Card>
      </div>
    </Container>
  );
};

export default CompleteProfileSection;
