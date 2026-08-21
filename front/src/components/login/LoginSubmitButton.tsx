import { LogIn, Loader2 } from 'lucide-react';
import Button from '../common/Button';

interface LoginSubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
}

const LoginSubmitButton = ({
  isLoading,
  disabled = false,
}: LoginSubmitButtonProps) => {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full mt-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-5 w-5 text-background" />
          <span>Iniciando sesión...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <LogIn className="h-5 w-5" />
          <span>Iniciar Sesión</span>
        </span>
      )}
    </Button>
  );
};

export default LoginSubmitButton;
