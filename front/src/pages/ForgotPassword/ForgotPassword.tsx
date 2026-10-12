import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PasswordResetCard from '../../components/password-reset/PasswordResetCard';
import ForgotPasswordForm from '../../components/password-reset/ForgotPasswordForm';

function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <PasswordResetCard
          title="¿Olvidaste tu contraseña?"
          subtitle="Ingresa tu correo y te enviaremos un enlace para crear una nueva."
        >
          <ForgotPasswordForm />
        </PasswordResetCard>
      </main>
      <Footer />
    </div>
  );
}

export default ForgotPassword;
