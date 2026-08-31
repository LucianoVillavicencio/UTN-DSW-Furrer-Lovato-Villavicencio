import { useEffect, useRef } from 'react';
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
  const pressStartedOnBackdrop = useRef(false);

  // Registered after any parent Modal's listener and stopping propagation, so
  // Escape here dismisses the confirmation and not the panel behind it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isLoading) return;
      e.stopImmediatePropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isLoading, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) {
          onCancel();
        }
        pressStartedOnBackdrop.current = false;
      }}
    >
      <Card className="w-full max-w-sm hover:translate-y-0 hover:shadow-lg">
        <h4 className="font-display text-lg font-semibold text-text">
          {title}
        </h4>
        <p className="mt-3 text-sm text-text-muted">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${danger ? 'bg-red-500! hover:bg-red-600! text-white!' : ''}`}
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
