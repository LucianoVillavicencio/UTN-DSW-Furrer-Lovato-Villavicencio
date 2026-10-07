// Overlay dialog that hosts the admin create/edit forms, the member detail
// panel and the new-member wizard. Closes on Escape or on a backdrop click
// that started on the backdrop. Sizes: 'md' for regular forms, 'lg' for the
// member detail panel, 'xl' for the wizard's desk-width layout.

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Card from '../../common/Card';

type ModalSize = 'md' | 'lg' | 'xl';

// 'md' is what every modal in the app was before the size prop existed; 'lg'
// is the member detail panel, which stacks four sections of forms; only the
// new-member wizard asks for 'xl', which is a desk-width working surface
// rather than a dialog.
const sizeStyles: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
}

const Modal = ({ title, onClose, children, size = 'md' }: ModalProps) => {
  // A `click` fires on the nearest common ancestor of its mousedown and
  // mouseup targets. Selecting text inside the card and releasing past its
  // edge therefore used to target the backdrop and throw the whole form away.
  // Closing only when the press STARTED on the backdrop fixes it.
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) {
          onClose();
        }
        pressStartedOnBackdrop.current = false;
      }}
    >
      <Card className={`w-full ${sizeStyles[size]} hover:translate-y-0 hover:shadow-lg`}>
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <h3 className="font-display text-lg font-semibold text-text">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </Card>
    </div>
  );
};

export default Modal;
