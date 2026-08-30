import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import { searchUsers } from '../../services/user.service';
import { getSubscriptionsByUser } from '../../services/subscription.service';
import { createManualPayment } from '../../services/payment.service';
import { parsePriceInput, formatPriceDisplay } from '../../lib/currency';
import type { User } from '../../types/user';
import type { Subscription } from '../../types/subscription';
import type { Payment } from '../../types/payment';

const PAY_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
];

interface RegisterPaymentFormProps {
  presetUser?: User;
  onRegistered?: (payment: Payment) => void;
}

const RegisterPaymentForm = ({
  presetUser,
  onRegistered,
}: RegisterPaymentFormProps) => {
  const [searchMode, setSearchMode] = useState<'dni' | 'email' | 'name'>('dni');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(
    presetUser ?? null,
  );
  // The subscriptions are tagged with the member they belong to, so both the
  // spinner and the reset on member change are derived from the selection
  // instead of an effect writing state during render.
  const [loadedSubs, setLoadedSubs] = useState<{
    userId: number;
    items: Subscription[];
  } | null>(null);
  const subscriptions =
    loadedSubs && loadedSubs.userId === selectedUser?.id
      ? loadedSubs.items
      : [];
  const isLoadingSubs = !!selectedUser && loadedSubs?.userId !== selectedUser.id;
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('');

  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState(PAY_METHODS[0].value);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUser) return;
    const userId = selectedUser.id;
    void getSubscriptionsByUser(userId)
      .then((subs) => {
        setLoadedSubs({ userId, items: subs });
        const active = subs.find(
          (s) => s.state?.toLowerCase() === 'activa' && !s.deleted,
        );
        setSelectedSubId(active?.id ?? subs[0]?.id ?? '');
        if (active?.plan?.price) {
          setAmount(formatPriceDisplay(active.plan.price));
        }
      })
      .catch((err: unknown) => {
        setLoadedSubs({ userId, items: [] });
        setSearchError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las suscripciones.',
        );
      });
  }, [selectedUser]);

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const query = {
        [searchMode]: searchMode === 'dni' ? Number(searchValue) : searchValue,
      };
      const data = await searchUsers(query);
      setResults(data);
      if (data.length === 0) {
        setSearchError('No se encontraron usuarios con ese criterio.');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'No se pudo buscar.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSub = (subId: number) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub?.plan?.price) {
      setAmount(formatPriceDisplay(sub.plan.price));
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    setSuccess(null);

    if (!selectedSubId) {
      setFormError('Elegí una suscripción.');
      return;
    }
    const amountNum = parsePriceInput(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setFormError('Ingresá un monto válido.');
      return;
    }

    setIsSaving(true);
    try {
      const payment = await createManualPayment({
        subscriptionId: Number(selectedSubId),
        amount: amountNum,
        payMethod: payMethod as
          | 'efectivo'
          | 'debito'
          | 'credito'
          | 'transferencia',
      });
      setSuccess(
        `Pago de $${formatPriceDisplay(amountNum)} registrado correctamente.`,
      );
      setAmount('');
      onRegistered?.(payment);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo registrar el pago.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!presetUser && !selectedUser && (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="w-28 shrink-0">
              <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
                Buscar por
              </label>
              <select
                value={searchMode}
                onChange={(e) =>
                  setSearchMode(e.target.value as typeof searchMode)
                }
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="dni">DNI</option>
                <option value="email">Email</option>
                <option value="name">Nombre</option>
              </select>
            </div>
            <div className="flex-1">
              <InputField
                label="Buscar socio"
                placeholder="Buscar socio..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              size="sm"
              className="shrink-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <FormAlert type="error" message={searchError} />
          {results.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setResults([]);
                      setSearchValue('');
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-text hover:bg-surface"
                  >
                    <span>
                      {u.name} {u.surname} — {u.email}
                    </span>
                    <span className="text-text-muted">
                      DNI {u.dni ?? 'Sin DNI'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text">
                {selectedUser.name} {selectedUser.surname}
              </p>
              <p className="text-xs text-text-muted">
                DNI {selectedUser.dni ?? 'Sin DNI'} · {selectedUser.email}
              </p>
            </div>
            {!presetUser && (
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-xs text-text-muted hover:text-primary"
              >
                Cambiar
              </button>
            )}
          </div>

          {isLoadingSubs ? (
            <p className="mt-3 text-sm text-text-muted">
              Cargando suscripciones...
            </p>
          ) : subscriptions.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              Este socio no tiene suscripciones.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
                  Suscripción
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSelectSub(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.plan?.name ?? `Plan #${s.planId}`} — {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <InputField
                    label="Monto"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej: 19995 o 19.995,50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {amount &&
                    Number.isFinite(parsePriceInput(amount)) &&
                    parsePriceInput(amount) > 0 && (
                      <p className="mt-1 text-xs text-primary">
                        Se va a registrar como $
                        {formatPriceDisplay(parsePriceInput(amount))}
                      </p>
                    )}
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
                    Método
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {PAY_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormAlert type="error" message={formError} />
              <FormAlert type="success" message={success} />

              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Registrando...' : 'Registrar pago'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterPaymentForm;
