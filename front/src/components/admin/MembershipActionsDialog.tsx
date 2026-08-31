import { useEffect, useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import { getRefundQuote, issueRefund } from '../../services/refund.service';
import { pauseSubscription } from '../../services/subscription.service';
import { refundSummary, zeroRefundReason } from './membership-actions';
import type { RefundQuote } from '../../types/refund';

interface MembershipActionsDialogProps {
  subscriptionId: number;
  onClose: () => void;
  // Fired after a refund is issued or the alternate "pause instead" action
  // succeeds, so the host panel can refresh its subscriptions/payments —
  // same role as RegisterPaymentForm's onRegistered.
  onChanged: () => void;
}

// Bespoke dialog, not ConfirmDialog: the refund step needs a real breakdown
// (refundSummary/zeroRefundReason), which ConfirmDialog's plain
// `description: string` has no slot for. Nested inside UserDetailPanel's
// Modal the same way ConfirmDialog already is — see ConfirmDialog.tsx for
// the overlay/Card shape this mirrors.
const MembershipActionsDialog = ({
  subscriptionId,
  onClose,
  onChanged,
}: MembershipActionsDialogProps) => {
  const [quote, setQuote] = useState<RefundQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isRefunding, setIsRefunding] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetches the quote as soon as the dialog opens — a pure read, so it's
  // safe before the admin has decided anything. issueRefund only ever fires
  // from the explicit "Confirmar reembolso" click below. The parent only
  // ever mounts this dialog for one subscriptionId at a time (closing always
  // unmounts it first — see UserDetailPanel's `refundSubId !== null &&`),
  // so the initial useState values above already cover the loading/no-error
  // starting point; every setState here happens from this effect's own
  // .then/.catch/.finally, not synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;
    getRefundQuote(subscriptionId)
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // getRefundQuote already turned the axios failure into a plain
        // Error whose .message IS the backend's real text (or a fallback it
        // picked itself) — see refund.service.ts. Reading err.message here,
        // not calling getApiErrorMessage again, matches
        // UserDetailPanel.tsx's handleDangerConfirm catch: a second call
        // would always fall through to getApiErrorMessage's own hardcoded
        // fallback, since a plain Error is never an AxiosError.
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo calcular el reembolso.',
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingQuote(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  const isBusy = isRefunding || isPausing;

  const handleConfirmRefund = async () => {
    setIsRefunding(true);
    setActionError(null);
    try {
      await issueRefund(subscriptionId);
      onChanged();
      onClose();
    } catch (err) {
      // Same reasoning as the quote-load catch above: issueRefund's own
      // catch already ran the axios error through getApiErrorMessage once.
      setActionError(
        err instanceof Error ? err.message : 'No se pudo emitir el reembolso.',
      );
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePauseInstead = async () => {
    setIsPausing(true);
    setActionError(null);
    try {
      await pauseSubscription(subscriptionId);
      onChanged();
      onClose();
    } catch (err) {
      // Same reasoning as the quote-load catch above: pauseSubscription's
      // own catch already ran the axios error through getApiErrorMessage
      // once.
      setActionError(
        err instanceof Error ? err.message : 'No se pudo pausar la suscripción.',
      );
    } finally {
      setIsPausing(false);
    }
  };

  const reason = quote ? zeroRefundReason(quote) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reembolsar suscripción"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      // Guarded the same way the explicit "Cerrar"/action buttons already
      // are: dismissing via backdrop click while issueRefund/pauseSubscription
      // is in flight would unmount the dialog mid-request, letting the admin
      // reopen it immediately and fire a second, concurrent refund/pause
      // before the first has resolved.
      onClick={() => {
        if (!isBusy) onClose();
      }}
    >
      <Card
        className="w-full max-w-sm hover:translate-y-0 hover:shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-display text-lg font-semibold text-text">
          Reembolsar suscripción
        </h4>

        {isLoadingQuote ? (
          <p className="mt-3 text-sm text-text-muted">Calculando reembolso...</p>
        ) : loadError ? (
          <FormAlert type="error" message={loadError} />
        ) : quote ? (
          <>
            <p className="mt-3 text-sm text-text-muted">{refundSummary(quote)}</p>
            {reason && (
              <div className="mt-3">
                <FormAlert type="warning" message={reason} />
              </div>
            )}
          </>
        ) : null}

        <div className="mt-3">
          <FormAlert type="error" message={actionError} />
        </div>

        {quote && !loadError && (
          <div className="mt-6 space-y-2">
            <Button
              onClick={handleConfirmRefund}
              disabled={isBusy}
              className="w-full bg-red-500! hover:bg-red-600! text-white!"
            >
              {isRefunding ? 'Procesando...' : 'Confirmar reembolso'}
            </Button>
            {/* The cheaper alternative — no money moves — kept as visible as
               the refund itself, not buried behind a separate flow. */}
            <Button
              onClick={handlePauseInstead}
              disabled={isBusy}
              variant="secondary"
              className="w-full"
            >
              {isPausing ? 'Pausando...' : 'Pausar en vez de reembolsar'}
            </Button>
          </div>
        )}

        <div className="mt-3">
          <Button
            onClick={onClose}
            disabled={isBusy}
            variant="secondary"
            className="w-full"
          >
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MembershipActionsDialog;
