import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import FormAlert from '../../components/common/FormAlert';
import Button from '../../components/common/Button';
import PasswordResetCard from '../../components/password-reset/PasswordResetCard';
import ResetPasswordForm from '../../components/password-reset/ResetPasswordForm';

// Landing page of the emailed link: /reset-password?token=...
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <PasswordResetCard
          title="Nueva contraseña"
          subtitle="Elige una contraseña de al menos 8 caracteres, con letras y números."
        >
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <FormAlert
                type="error"
                message="El enlace no es válido. Pide uno nuevo desde la pantalla de recuperación."
              />
              <Button
                href="/forgot-password"
                variant="primary"
                size="md"
                className="w-full"
              >
                Pedir un enlace nuevo
              </Button>
            </div>
          )}
        </PasswordResetCard>
      </main>
      <Footer />
    </div>
  );
}

export default ResetPassword;
