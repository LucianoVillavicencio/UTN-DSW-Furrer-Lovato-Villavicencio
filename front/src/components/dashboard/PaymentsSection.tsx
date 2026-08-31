import { useEffect, useState } from 'react';
import { Receipt, Loader2, CreditCard } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import ConfirmDialog from '../admin/ConfirmDialog';
import SavedCardForm from './SavedCardForm';
import { formatCardLabel, cardExpiryWarning } from './saved-card';
import { getMyPayments } from '../../services/payment.service';
import { getMySavedCard, deleteCard } from '../../services/savedCard.service';
import {
  getMySubscription,
  setAutoRenew,
} from '../../services/subscription.service';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';
import type { Payment } from '../../types/payment';
import type { SavedCard } from '../../types/savedCard';
import type { Subscription } from '../../types/subscription';

const stateBadge: Record<string, string> = {
  completado: 'bg-primary/10 text-primary border-primary/30',
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/30',
  reembolsado: 'bg-text-muted/10 text-text-muted border-border',
};

const PaymentsSection = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [card, setCard] = useState<SavedCard | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCardForm, setShowCardForm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [autoRenewError, setAutoRenewError] = useState<string | null>(null);

  // Every setState below lives in an async callback, so this effect only
  // starts the requests; Promise.allSettled lets one failing source leave the
  // others intact, following PlanSection.tsx's fetchPlans pattern.
  useEffect(() => {
    Promise.allSettled([
      getMyPayments(),
      getMySavedCard(),
      getMySubscription(),
    ])
      .then(([paymentsRes, cardRes, subRes]) => {
        if (paymentsRes.status === 'fulfilled') {
          setPayments(paymentsRes.value);
        } else {
          setError(
            paymentsRes.reason instanceof Error
              ? paymentsRes.reason.message
              : 'No se pudo cargar tu historial.',
          );
        }
        setCard(cardRes.status === 'fulfilled' ? cardRes.value : null);
        setSubscription(subRes.status === 'fulfilled' ? subRes.value : null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleCardSaved = (savedCard: SavedCard) => {
    setCard(savedCard);
    setShowCardForm(false);
    setCardError(null);
    setCardSuccess('Tarjeta guardada correctamente.');
  };

  const confirmDeleteCard = async () => {
    if (!card) return;
    setIsDeleting(true);
    setCardError(null);
    try {
      await deleteCard(card.id);
      setCard(null);
      setConfirmingDelete(false);
      setCardSuccess('Tarjeta eliminada.');
      // A card-less subscription cannot auto-renew anymore.
      setSubscription((prev) =>
        prev ? { ...prev, autoRenew: false } : prev,
      );
    } catch (err) {
      setCardError(
        err instanceof Error ? err.message : 'No se pudo eliminar la tarjeta.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleAutoRenew = async (next: boolean) => {
    setIsTogglingAutoRenew(true);
    setAutoRenewError(null);
    try {
      const updated = await setAutoRenew(next);
      setSubscription(updated);
    } catch (err) {
      setAutoRenewError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar la renovación automática.',
      );
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const expiryWarning = card ? cardExpiryWarning(card, new Date()) : null;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="text-center hover:translate-y-0 hover:shadow-lg">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="text-center hover:translate-y-0 hover:shadow-lg">
          <Receipt className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 font-body text-sm text-text-muted">
            Todavía no tenés pagos registrados. Los pagos presenciales que
            registre el gimnasio van a aparecer acá.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-surface">
              <tr>
                {['Fecha', 'Monto', 'Método', 'Estado'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id} className="bg-background font-body text-text">
                  <td className="px-4 py-3">
                    {formatDateOnly(p.date.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3">${formatPriceDisplay(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.payMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${
                        stateBadge[p.state?.toLowerCase() ?? ''] ??
                        stateBadge.completado
                      }`}
                    >
                      {p.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="hover:translate-y-0 hover:shadow-lg">
        <h3 className="font-display text-lg font-semibold text-text">
          Forma de pago
        </h3>

        <div className="mt-4 space-y-3">
          <FormAlert type="success" message={cardSuccess} />
          <FormAlert type="error" message={cardError} />
        </div>

        {!isLoading && card && !showCardForm && (
          <div className="mt-4 space-y-4">
            {expiryWarning && (
              <FormAlert type="warning" message={expiryWarning} />
            )}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              <span className="font-body text-sm text-text">
                {formatCardLabel(card)}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCardForm(true)}
              >
                Cambiar tarjeta
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
              >
                Eliminar
              </Button>
            </div>

            <label className="flex items-center gap-3 text-sm text-text">
              <input
                type="checkbox"
                checked={subscription?.autoRenew ?? false}
                disabled={isTogglingAutoRenew}
                onChange={(e) => handleToggleAutoRenew(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Renovación automática
            </label>
            <FormAlert type="error" message={autoRenewError} />
          </div>
        )}

        {!isLoading && !card && !showCardForm && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-text-muted">
              Todavía no guardaste una tarjeta. Guardá una para activar la
              renovación automática de tu plan.
            </p>
            <label className="flex items-center gap-3 text-sm text-text-muted">
              <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
              Renovación automática (necesitás una tarjeta guardada)
            </label>
          </div>
        )}

        {!isLoading && (showCardForm || !card) && (
          <div className="mt-4">
            <SavedCardForm onSaved={handleCardSaved} />
            {card && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setShowCardForm(false)}
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </Card>

      {confirmingDelete && (
        <ConfirmDialog
          title="Eliminar tarjeta"
          description="Se va a eliminar tu tarjeta guardada. Si tenías la renovación automática activada, se desactiva también."
          confirmLabel="Eliminar"
          danger
          isLoading={isDeleting}
          onConfirm={confirmDeleteCard}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
};

export default PaymentsSection;
