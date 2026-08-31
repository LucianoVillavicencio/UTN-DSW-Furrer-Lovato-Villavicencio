import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import { Lock } from 'lucide-react';

interface OwnerPasswordPromptProps {
  isLoading: boolean;
  error: string | null;
  onUnlock: (password: string) => Promise<boolean>;
}

// Gate in front of the financial panel. The field never carries
// autoComplete — a saved browser suggestion for this one password would be
// worse than typing it every time — and clears itself after a failed
// attempt so a wrong guess never lingers on screen.
const OwnerPasswordPrompt = ({
  isLoading,
  error,
  onUnlock,
}: OwnerPasswordPromptProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value || isLoading) return;
    const ok = await onUnlock(value);
    if (!ok) setValue('');
  };

  return (
    <Card className="hover:translate-y-0 hover:shadow-lg">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-text">
            Panel financiero
          </h3>
          <p className="mt-1 font-body text-sm text-text-muted">
            Ingresá la contraseña del dueño para ver ingresos, MRR y el
            desglose por plan y método de pago.
          </p>
        </div>
        <InputField
          label="Contraseña"
          type="password"
          autoComplete="off"
          icon={<Lock className="h-4 w-4" />}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
        />
        <FormAlert type="error" message={error} />
        <Button
          type="submit"
          disabled={isLoading || !value}
          className="w-full"
        >
          {isLoading ? 'Verificando...' : 'Ver más'}
        </Button>
      </form>
    </Card>
  );
};

export default OwnerPasswordPrompt;
