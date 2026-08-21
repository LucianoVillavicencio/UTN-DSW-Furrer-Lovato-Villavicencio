import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import Button from "../common/Button";
import InputField from "../common/InputField";
import FormAlert from "../common/FormAlert";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import RegisterPaymentForm from "./RegisterPaymentForm";
import { formatDateOnly } from "../../lib/date";
import { formatPriceDisplay } from "../../lib/currency";
import {
  adminUpdateUser,
  deleteUser,
  restoreUser,
  type AdminUpdateUserPayload,
} from "../../services/user.service";
import {
  getSubscriptionsByUser,
  cancelSubscription,
} from "../../services/subscription.service";
import { getPaymentsByUser } from "../../services/payment.service";
import type { User } from "../../types/user";
import type { Subscription } from "../../types/subscription";
import type { Payment } from "../../types/payment";

interface UserDetailPanelProps {
  user: User;
  currentAdminDni: number;
  onClose: () => void;
  onChanged: () => void;
}

const UserDetailPanel = ({ user, currentAdminDni, onClose, onChanged }: UserDetailPanelProps) => {
  const [form, setForm] = useState<AdminUpdateUserPayload>({
    name: user.name,
    surname: user.surname,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [confirmDangerAction, setConfirmDangerAction] = useState<
    "delete" | "restore" | "cancelSub" | null
  >(null);
  const [pendingSubId, setPendingSubId] = useState<number | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const [subs, pays] = await Promise.all([
        getSubscriptionsByUser(user.dni),
        getPaymentsByUser(user.dni),
      ]);
      setSubscriptions(subs);
      setPayments(pays);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cargar el historial.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.dni]);

  const isDirty =
    form.name !== user.name ||
    form.surname !== user.surname ||
    form.email !== user.email ||
    form.phone !== user.phone ||
    form.role !== user.role;

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    try {
      await adminUpdateUser(user.dni, form);
      setSaveSuccess("Cambios guardados.");
      onChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDangerConfirm = async () => {
    setIsActing(true);
    setActionError(null);
    try {
      if (confirmDangerAction === "delete") {
        await deleteUser(user.dni);
        onChanged();
        onClose();
      } else if (confirmDangerAction === "restore") {
        await restoreUser(user.dni);
        onChanged();
        onClose();
      } else if (confirmDangerAction === "cancelSub" && pendingSubId) {
        const sub = subscriptions.find((s) => s.id === pendingSubId);
        if (sub) {
          await cancelSubscription(sub);
          await loadHistory();
        }
      }
      setConfirmDangerAction(null);
      setPendingSubId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <Modal title={`${user.name} ${user.surname}`} onClose={onClose}>
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        {/* Datos */}
        <section>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
            Datos
          </h4>
          <div className="mt-3 space-y-3">
            <FormAlert type="error" message={saveError} />
            <FormAlert type="success" message={saveSuccess} />
            <InputField label="DNI" value={user.dni} disabled readOnly />
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="Nombre"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <InputField
                label="Apellido"
                value={form.surname ?? ""}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
              />
            </div>
            <InputField
              label="Email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <InputField
              label="Teléfono"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div>
              <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
                Rol
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "user" | "admin" })}
                disabled={user.dni === currentAdminDni}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              {user.dni === currentAdminDni && (
                <p className="mt-1 text-xs text-text-muted">No podés cambiar tu propio rol.</p>
              )}
            </div>
            <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </section>

        {/* Suscripción */}
        <section className="border-t border-border pt-4">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
            Suscripciones
          </h4>
          {isLoadingHistory ? (
            <p className="mt-3 text-sm text-text-muted">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">Sin suscripciones.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {subscriptions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-semibold text-text">{s.plan?.name ?? `Plan #${s.planId}`}</span>{" "}
                    <span className="text-text-muted">
                      — {s.state} · vence {formatDateOnly(s.endDate)}
                    </span>
                  </div>
                  {s.state?.toLowerCase() === "activa" && !s.deleted && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingSubId(s.id ?? null);
                        setConfirmDangerAction("cancelSub");
                      }}
                      className="text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Cancelar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pagos */}
        <section className="border-t border-border pt-4">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
            Pagos
          </h4>
          {isLoadingHistory ? (
            <p className="mt-3 text-sm text-text-muted">Cargando...</p>
          ) : payments.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">Sin pagos registrados.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between text-text-muted">
                  <span>{formatDateOnly(p.date.slice(0, 10))}</span>
                  <span>${formatPriceDisplay(p.amount)}</span>
                  <span className="capitalize">{p.payMethod}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-text-muted">Registrar pago presencial</p>
            <RegisterPaymentForm presetUser={user} onRegistered={loadHistory} />
          </div>
        </section>

        {/* Zona de peligro */}
        <section className="rounded-xl border border-red-500/30 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-4 w-4" />
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide">
              Zona de peligro
            </h4>
          </div>
          <FormAlert type="error" message={actionError} />
          <div className="mt-3">
            {user.deleted ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDangerAction("restore")}
              >
                Restaurar cuenta
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setConfirmDangerAction("delete")}
                className="!bg-red-500 hover:!bg-red-600 !text-white"
              >
                Dar de baja cuenta
              </Button>
            )}
          </div>
        </section>
      </div>

      {confirmDangerAction && (
        <ConfirmDialog
          title={
            confirmDangerAction === "delete"
              ? "Dar de baja cuenta"
              : confirmDangerAction === "restore"
                ? "Restaurar cuenta"
                : "Cancelar suscripción"
          }
          description={
            confirmDangerAction === "delete"
              ? `"${user.name} ${user.surname}" no va a poder iniciar sesión hasta que se restaure la cuenta.`
              : confirmDangerAction === "restore"
                ? `"${user.name} ${user.surname}" vuelve a poder iniciar sesión.`
                : "Esta suscripción va a quedar cancelada."
          }
          confirmLabel={
            confirmDangerAction === "delete"
              ? "Dar de baja"
              : confirmDangerAction === "restore"
                ? "Restaurar"
                : "Cancelar suscripción"
          }
          danger={confirmDangerAction !== "restore"}
          isLoading={isActing}
          onConfirm={handleDangerConfirm}
          onCancel={() => {
            setConfirmDangerAction(null);
            setPendingSubId(null);
          }}
        />
      )}
    </Modal>
  );
};

export default UserDetailPanel;
