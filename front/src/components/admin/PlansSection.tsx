import { useEffect, useState } from "react";
import { Pencil, Trash2, RotateCcw, Plus, X, Check } from "lucide-react";
import Button from "../common/Button";
import InputField from "../common/InputField";
import FormAlert from "../common/FormAlert";
import DataTable, { type DataTableColumn } from "./DataTable";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import {
  getPlans,
  getDeletedPlans,
  createPlan,
  updatePlan,
  deletePlan,
  restorePlan,
} from "../../services/plan.service";
import type { Plan, PlanFeature } from "../../types/plan";
import { parsePriceInput, formatPriceDisplay } from "../../lib/currency";

const emptyForm: Plan = { name: "", description: "", price: 0, numDays: 30 };

const PlansSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Plan>(emptyForm);
  // Precio y días se editan como texto libre, no como number: si converimos
  // a Number en cada tecla, escribir "19.995" nunca llega a completarse —
  // Number("19.") es 19, así que el "." recién tipeado desaparece del input
  // controlado apenas se re-renderiza. Se guarda el texto tal cual y se
  // convierte una sola vez, al guardar.
  const [priceText, setPriceText] = useState("");
  const [numDaysText, setNumDaysText] = useState("");
  const [featuresForm, setFeaturesForm] = useState<PlanFeature[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = showDeleted ? await getDeletedPlans() : await getPlans();
      setPlans(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar la lista.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  const openCreate = () => {
    setForm(emptyForm);
    setPriceText("");
    setNumDaysText(String(emptyForm.numDays));
    setFeaturesForm([]);
    setFormError(null);
    setIsCreating(true);
  };

  const openEdit = (plan: Plan) => {
    setForm(plan);
    setPriceText(formatPriceDisplay(plan.price));
    setNumDaysText(String(plan.numDays));
    setFeaturesForm(plan.features ?? []);
    setFormError(null);
    setEditing(plan);
  };

  const addFeatureRow = () => {
    setFeaturesForm((prev) => [...prev, { label: "", available: true }]);
  };

  const updateFeatureRow = (index: number, patch: Partial<PlanFeature>) => {
    setFeaturesForm((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeFeatureRow = (index: number) => {
    setFeaturesForm((prev) => prev.filter((_, i) => i !== index));
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setFormError(null);

    const price = parsePriceInput(priceText);
    const numDays = Number(numDaysText);

    if (!form.name.trim() || !priceText || !Number.isFinite(price) || price <= 0 || !numDays || numDays <= 0) {
      setFormError("Nombre, precio y días son obligatorios y deben ser mayores a cero.");
      return;
    }

    const features = featuresForm
      .map((f) => ({ ...f, label: f.label.trim() }))
      .filter((f) => f.label.length > 0);
    const payload: Plan = { ...form, price, numDays, features };

    setIsSaving(true);
    try {
      if (isCreating) {
        await createPlan(payload);
      } else {
        await updatePlan(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) return;
    setIsDeleting(true);
    setListError(null);
    try {
      if (showDeleted) {
        await restorePlan(pendingDelete.id);
      } else {
        await deletePlan(pendingDelete.id);
      }
      setPendingDelete(null);
      await load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Plan>[] = [
    { header: "Nombre", cell: (p) => p.name },
    { header: "Precio", cell: (p) => `$${formatPriceDisplay(p.price)}` },
    { header: "Días", cell: (p) => p.numDays },
    {
      header: "Acciones",
      cell: (p) => (
        <div className="flex gap-2">
          {!showDeleted && (
            <button
              type="button"
              onClick={() => openEdit(p)}
              aria-label={`Editar ${p.name}`}
              className="rounded-lg p-1.5 text-text-muted hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPendingDelete(p)}
            aria-label={showDeleted ? `Restaurar ${p.name}` : `Eliminar ${p.name}`}
            className="rounded-lg p-1.5 text-text-muted hover:text-red-400"
          >
            {showDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-text">Planes</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Mostrar eliminados
          </label>
          <Button size="sm" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Cambiar el precio no afecta a las suscripciones ya activas, solo a las nuevas.
      </p>

      <FormAlert type="error" message={loadError ?? listError} />

      <DataTable
        columns={columns}
        rows={plans}
        rowKey={(p) => p.id ?? p.name}
        isLoading={isLoading}
        emptyMessage={showDeleted ? "No hay planes eliminados." : "Todavía no hay planes cargados."}
      />

      {(isCreating || editing) && (
        <Modal title={isCreating ? "Agregar plan" : "Editar plan"} onClose={closeModal}>
          <div className="space-y-4">
            <FormAlert type="error" message={formError} />
            <InputField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <InputField
              label="Descripción"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputField
                  label="Precio"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 19995 o 19.995,50"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                />
                {priceText && Number.isFinite(parsePriceInput(priceText)) && parsePriceInput(priceText) > 0 && (
                  <p className="mt-1 text-xs text-primary">
                    Se va a guardar como ${formatPriceDisplay(parsePriceInput(priceText))}
                  </p>
                )}
              </div>
              <InputField
                label="Días"
                type="number"
                value={numDaysText}
                onChange={(e) => setNumDaysText(e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="font-body text-xs sm:text-sm font-medium text-text">
                  Características
                </label>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </div>

              {featuresForm.length === 0 ? (
                <p className="text-xs text-text-muted">
                  Sin características cargadas todavía. "Agregar" para sumar la primera.
                </p>
              ) : (
                <ul className="space-y-2">
                  {featuresForm.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateFeatureRow(index, { available: !feature.available })}
                        aria-label={feature.available ? "Marcar como no incluida" : "Marcar como incluida"}
                        aria-pressed={feature.available}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          feature.available
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border text-text-muted"
                        }`}
                      >
                        {feature.available ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        value={feature.label}
                        onChange={(e) => updateFeatureRow(index, { label: e.target.value })}
                        placeholder="Ej: Clases grupales ilimitadas"
                        className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeatureRow(index)}
                        aria-label="Quitar característica"
                        className="shrink-0 rounded-lg p-1.5 text-text-muted hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-text-muted">
                El ícono a la izquierda marca si la característica está incluida en el plan o no.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="secondary" onClick={closeModal} disabled={isSaving}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={showDeleted ? "Restaurar plan" : "Eliminar plan"}
          description={
            showDeleted
              ? `"${pendingDelete.name}" volverá a estar disponible.`
              : `"${pendingDelete.name}" se va a dar de baja (baja lógica) — se puede restaurar después.`
          }
          confirmLabel={showDeleted ? "Restaurar" : "Eliminar"}
          danger={!showDeleted}
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default PlansSection;
