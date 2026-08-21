import Card from '../common/Card';
import Button from '../common/Button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  description,
  confirmLabel = 'Confirmar',
  isLoading = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-sm hover:-translate-y-0 hover:shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-display text-lg font-semibold text-text">
          {title}
        </h4>
        <p className="mt-3 text-sm text-text-muted">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${danger ? '!bg-red-500 hover:!bg-red-600 !text-white' : ''}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmDialog;
