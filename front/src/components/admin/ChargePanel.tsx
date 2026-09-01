import { useEffect, useRef, useState } from 'react';
import { Search, Banknote, CreditCard, QrCode } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import RegisterPaymentForm from './RegisterPaymentForm';
import { searchUsers } from '../../services/user.service';
import { getSubscriptionsByUser } from '../../services/subscription.service';
import { getPaymentsByUser } from '../../services/payment.service';
import { getPlanDurations } from '../../services/plan.service';
import {
  createChargeOrder,
  getChargeOrder,
  cancelChargeOrder,
  type ChargeOrderCreated,
} from '../../services/chargeOrder.service';
import {
  POLL_INTERVAL_MS,
  hasAutoRenewedToday,
  needsChargeOrder,
  shouldKeepPolling,
  statusLabel,
} from './charge-panel';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';
import type { User } from '../../types/user';
import type { Subscription } from '../../types/subscription';
import type { Payment } from '../../types/payment';

type ChargeMethod = 'efectivo' | 'point' | 'qr';

// The plan's own 1-month price (no PlanDuration row) alongside its optional
// 3/6/12-month rows — see getPlanDurations and resolveTerm's convention on
// the backend.
interface ChargeTerm {
  months: number;
  price: number | string;
}

// The order's live status/amount/qrPayload/expiresAt/newEndDate, kept in one
// place so creation and every poll tick write to the same shape. See
// charge-panel.ts's statusLabel/shouldKeepPolling for the pure logic driving
// what's rendered here.
type OrderView = ChargeOrderCreated & { newEndDate: string | null };

const METHODS: { value: ChargeMethod; label: string; icon: typeof Banknote }[] =
  [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'point', label: 'Tarjeta (Point)', icon: CreditCard },
    { value: 'qr', label: 'QR', icon: QrCode },
  ];

// Frontend-only mirrors of the backend's single-terminal/single-caja hardware
// setup (MP_POINT_TERMINAL_ID / MP_QR_EXTERNAL_POS_ID). No backend endpoint
// exposes these, so they travel as their own Vite env vars — see
// front/.env.example — and must be kept in sync with the backend's values by
// whoever configures each deploy.
const POINT_TERMINAL_ID = import.meta.env.VITE_MP_POINT_TERMINAL_ID as
  | string
  | undefined;
const QR_EXTERNAL_POS_ID = import.meta.env.VITE_MP_QR_EXTERNAL_POS_ID as
  | string
  | undefined;

interface ChargePanelProps {
  // Fired once a charge (cash, immediately; point/qr, once polling reaches
  // 'pagada') is confirmed, so the host section can refresh its payments
  // table. Same role as RegisterPaymentForm's onRegistered={reload}.
  onCharged?: () => void;
}

const ChargePanel = ({ onCharged }: ChargePanelProps) => {
  const [method, setMethod] = useState<ChargeMethod>('efectivo');

  // Member search — copied from RegisterPaymentForm.tsx's inline block (a
  // third, deliberate copy; see the task report for why it wasn't extracted).
  const [searchMode, setSearchMode] = useState<'dni' | 'email' | 'name'>('dni');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadedSubs, setLoadedSubs] = useState<{
    userId: number;
    items: Subscription[];
  } | null>(null);
  const subscriptions =
    loadedSubs && loadedSubs.userId === selectedUser?.id ? loadedSubs.items : [];
  const isLoadingSubs = !!selectedUser && loadedSubs?.userId !== selectedUser.id;
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('');

  const [terms, setTerms] = useState<ChargeTerm[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);

  // The advance-payment warning's data source — see charge-panel.ts's
  // hasAutoRenewedToday and the Ruling in the task brief.
  const [payments, setPayments] = useState<Payment[]>([]);

  const [orderView, setOrderView] = useState<OrderView | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Polling — genuinely new in this codebase. Follows GoogleAuthButton.tsx's
  // timer-lifecycle precedent: the interval id lives in a ref, is cleared in
  // the effect's cleanup, and every async callback checks isMountedRef before
  // touching state so a poll that resolves after unmount is a no-op.
  const pollingRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollOnce = (id: number) => {
    void getChargeOrder(id)
      .then((status) => {
        if (!isMountedRef.current) return;
        setOrderView((prev) => (prev && prev.id === id ? { ...prev, ...status } : prev));
        if (!shouldKeepPolling(status.status, status.expiresAt, new Date())) {
          stopPolling();
          if (status.status === 'pagada') {
            onCharged?.();
          }
        }
      })
      .catch((err: unknown) => {
        if (!isMountedRef.current) return;
        stopPolling();
        setOrderError(
          err instanceof Error
            ? err.message
            : 'No se pudo consultar el estado del cobro.',
        );
      });
  };

  const startPolling = (id: number) => {
    stopPolling();
    pollingRef.current = window.setInterval(() => pollOnce(id), POLL_INTERVAL_MS);
  };

  // Member selection only starts the fetches; every setState here lives in
  // an async callback (.then/.catch), never synchronously in the effect body
  // — the downstream resets that go with picking or clearing a member live in
  // the click handlers that change `selectedUser` (selectMember below), the
  // same split RegisterPaymentForm.tsx and PlanSection.tsx already use.
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
      })
      .catch((err: unknown) => {
        setLoadedSubs({ userId, items: [] });
        setSearchError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las suscripciones.',
        );
      });

    void getPaymentsByUser(userId)
      .then(setPayments)
      .catch(() => setPayments([]));
  }, [selectedUser]);

  // Subscription selection loads that plan's discounted terms. Resetting
  // terms/order for a NEWLY picked subscription happens in handleSelectSub
  // below; this effect only fetches and only sets state from its own
  // .then/.catch, same shape as PlanSection.tsx's term-loading effect.
  useEffect(() => {
    const sub = loadedSubs?.items.find((s) => s.id === selectedSubId);
    if (!sub?.planId) return;

    let cancelled = false;
    getPlanDurations(sub.planId)
      .then((durations) => {
        if (cancelled) return;
        // The plan's own 1-month price is never a PlanDuration row — see
        // resolveTerm's convention on the backend.
        const oneMonth: ChargeTerm = { months: 1, price: sub.plan?.price ?? 0 };
        const options: ChargeTerm[] = [oneMonth, ...durations];
        setTerms(options);
        setSelectedMonths(options[0].months);
      })
      .catch(() => {
        if (cancelled) return;
        setTerms([]);
        setSelectedMonths(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSubId, loadedSubs]);

  const autoRenewedToday = hasAutoRenewedToday(payments, new Date());

  // Resets that go with clearing/selecting a member, subscription or method —
  // kept out of the effects above so no effect body calls setState
  // synchronously (only from its own async fetch callbacks).
  const resetOrderState = () => {
    stopPolling();
    setOrderView(null);
    setOrderError(null);
  };

  const selectMember = (user: User | null) => {
    setSelectedUser(user);
    setLoadedSubs(null);
    setSelectedSubId('');
    setTerms([]);
    setSelectedMonths(null);
    setPayments([]);
    resetOrderState();
  };

  const handleSelectSub = (subId: number) => {
    setSelectedSubId(subId);
    setTerms([]);
    setSelectedMonths(null);
    resetOrderState();
  };

  const selectMethod = (value: ChargeMethod) => {
    setMethod(value);
    resetOrderState();
  };

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

  const isPointConfigured = Boolean(POINT_TERMINAL_ID);
  const isQrConfigured = Boolean(QR_EXTERNAL_POS_ID);
  const collectionPointId =
    method === 'point'
      ? POINT_TERMINAL_ID
      : method === 'qr'
        ? QR_EXTERNAL_POS_ID
        : undefined;

  const isOrderPending = orderView?.status === 'pendiente';

  const handleCreateOrder = async () => {
    // The `method === 'efectivo'` form (not needsChargeOrder(method)) is
    // required here: TypeScript narrows `method` to 'point' | 'qr' for the
    // rest of this function from a literal comparison, which
    // createChargeOrder's payload type below depends on; a plain boolean
    // function call wouldn't narrow it.
    if (method === 'efectivo' || !selectedSubId || !selectedMonths) return;
    if (!collectionPointId) return;

    setOrderError(null);
    setIsCreatingOrder(true);
    try {
      const created = await createChargeOrder({
        subscriptionId: Number(selectedSubId),
        months: selectedMonths,
        method,
        collectionPointId,
      });
      setOrderView({ ...created, newEndDate: null });
      startPolling(created.id);
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'No se pudo iniciar el cobro.',
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    if (!orderView) return;
    const id = orderView.id;
    // Optimistic stop: the backend guarantees the local cancel always
    // succeeds, so the UI does not wait for a final poll to confirm it.
    stopPolling();
    setOrderView((prev) => (prev ? { ...prev, status: 'cancelada' } : prev));
    void cancelChargeOrder(id).catch((err: unknown) => {
      if (!isMountedRef.current) return;
      setOrderError(
        err instanceof Error ? err.message : 'No se pudo cancelar el cobro.',
      );
    });
  };

  const handleNewCharge = () => {
    resetOrderState();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => {
          const disabledByConfig =
            (m.value === 'point' && !isPointConfigured) ||
            (m.value === 'qr' && !isQrConfigured);
          // While a point/qr order is pendiente, ANY tab click — including
          // reclicking the active one — must not silently abandon it: the
          // Point terminal and QR caja are each a single shared physical
          // resource, so a client-side-only reset would leave the backend's
          // order stuck 'pendiente' (and the collection point 409-blocked)
          // until it expires on its own. Disabling every tab forces the
          // admin through "Cancelar cobro", the one path that actually calls
          // cancelChargeOrder.
          const disabledByPending = isOrderPending;
          const disabled = disabledByConfig || disabledByPending;
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              type="button"
              disabled={disabled}
              title={
                disabledByConfig
                  ? `${m.label} no está configurado (falta la variable de entorno del panel).`
                  : disabledByPending
                    ? 'Hay un cobro en curso. Cancelalo con "Cancelar cobro" antes de tocar los métodos.'
                    : undefined
              }
              onClick={() => selectMethod(m.value)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                method === m.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text hover:border-primary/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>
      {method === 'point' && !isPointConfigured && (
        <p className="text-xs text-text-muted">
          Falta configurar VITE_MP_POINT_TERMINAL_ID para cobrar con Point.
        </p>
      )}
      {method === 'qr' && !isQrConfigured && (
        <p className="text-xs text-text-muted">
          Falta configurar VITE_MP_QR_EXTERNAL_POS_ID para cobrar con QR.
        </p>
      )}

      {!needsChargeOrder(method) ? (
        <RegisterPaymentForm onRegistered={() => onCharged?.()} />
      ) : (
        <div className="space-y-4">
          {!selectedUser && (
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
                          selectMember(u);
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
                {!isOrderPending && (
                  <button
                    type="button"
                    onClick={() => selectMember(null)}
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
                      disabled={isOrderPending}
                      onChange={(e) => handleSelectSub(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                    >
                      {subscriptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.plan?.name ?? `Plan #${s.planId}`} — {s.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {autoRenewedToday && (
                    <FormAlert
                      type="warning"
                      message="Esta membresía ya se renovó automáticamente hoy."
                    />
                  )}

                  {terms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Plazo
                      </p>
                      {terms.map((term) => (
                        <button
                          key={term.months}
                          type="button"
                          disabled={isOrderPending}
                          onClick={() => setSelectedMonths(term.months)}
                          className={`w-full rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            selectedMonths === term.months
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-body text-sm font-semibold text-text">
                              {term.months} {term.months === 1 ? 'mes' : 'meses'}
                            </span>
                            <span className="font-body text-sm text-text">
                              ${formatPriceDisplay(term.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <FormAlert type="error" message={orderError} />

                  {!orderView && (
                    <Button
                      onClick={handleCreateOrder}
                      disabled={
                        isCreatingOrder ||
                        !selectedSubId ||
                        !selectedMonths ||
                        !collectionPointId
                      }
                      className="w-full"
                    >
                      {isCreatingOrder ? 'Iniciando cobro...' : 'Iniciar cobro'}
                    </Button>
                  )}

                  {orderView && (
                    <div className="space-y-3 rounded-xl border border-border p-4 text-center">
                      <p className="font-display text-lg font-semibold text-text">
                        {statusLabel(orderView.status, method)}
                      </p>
                      <p className="text-sm text-text-muted">
                        Monto: ${formatPriceDisplay(orderView.amount)}
                      </p>

                      {method === 'qr' && orderView.status === 'pendiente' && (
                        <p className="text-xs text-text-muted">
                          Pedile al socio que escanee el QR impreso en el
                          mostrador desde la app.
                        </p>
                      )}

                      {orderView.status === 'pagada' && (
                        <div>
                          <p className="text-sm text-text">
                            Se cobraron ${formatPriceDisplay(orderView.amount)}.
                          </p>
                          {orderView.newEndDate && (
                            <p className="text-sm text-text-muted">
                              Nueva vigencia: {formatDateOnly(orderView.newEndDate)}
                            </p>
                          )}
                          <Button
                            onClick={handleNewCharge}
                            variant="secondary"
                            size="sm"
                            className="mt-3"
                          >
                            Nuevo cobro
                          </Button>
                        </div>
                      )}

                      {['cancelada', 'expirada', 'error'].includes(
                        orderView.status,
                      ) && (
                        <Button
                          onClick={handleNewCharge}
                          variant="secondary"
                          size="sm"
                        >
                          Reintentar
                        </Button>
                      )}

                      {isOrderPending && (
                        <Button
                          onClick={handleCancelOrder}
                          variant="secondary"
                          className="w-full"
                        >
                          Cancelar cobro
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChargePanel;
