import { useEffect, useState } from 'react';
import { Pencil, Trash2, RotateCcw, Plus, X, Check } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import PlanDurationsField from './PlanDurationsField';
import {
  getPlans,
  getDeletedPlans,
  createPlan,
  updatePlan,
  deletePlan,
  restorePlan,
} from '../../services/plan.service';
import type { Plan, PlanFeature } from '../../types/plan';
import { classAllowanceLabel } from '../plans/plans.data';
import { parsePriceInput, formatPriceDisplay } from '../../lib/currency';

const emptyForm: Plan = {
  name: '',
  description: '',
  price: 0,
  numDays: 30,
  maxClasses: 0,
  highlighted: false,
};

// The allowance is three states, not a number: "unlimited" travels as null and
// cannot be typed into a number input.
type ClassesMode = 'none' | 'limited' | 'unlimited';

const CLASSES_MODES: { value: ClassesMode; label: string }[] = [
  { value: 'none', label: 'Sin clases' },
  { value: 'limited', label: 'Cantidad fija' },
  { value: 'unlimited', label: 'Ilimitadas' },
];

const classesModeOf = (maxClasses?: number | null): ClassesMode => {
  if (maxClasses === null) return 'unlimited';
  if (maxClasses && maxClasses > 0) return 'limited';
  return 'none';
};

const PlansSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  // "Loading" is derived from the filter the list in state came from, so
  // toggling the deleted filter shows the spinner without this component
  // writing state from inside an effect.
  const [loadedFilter, setLoadedFilter] = useState<boolean | null>(null);
  const isLoading = loadedFilter !== showDeleted;
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Plan>(emptyForm);
  // Price and days are edited as free text, not as numbers: converting on every
  // keystroke means "19.995" can never be finished — Number("19.") is 19, so the
  // dot just typed vanishes from the controlled input on the next render. The
  // text is kept as typed and converted once, on save.
  const [priceText, setPriceText] = useState('');
  const [numDaysText, setNumDaysText] = useState('');
  const [featuresForm, setFeaturesForm] = useState<PlanFeature[]>([]);
  const [classesMode, setClassesMode] = useState<ClassesMode>('none');
  const [maxClassesText, setMaxClassesText] = useState('1');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Every setState lives in an async callback, so the effect below only starts
  // the request instead of updating state while React renders.
  const fetchPlans = (deleted: boolean) =>
    (deleted ? getDeletedPlans() : getPlans())
      .then((data) => {
        setPlans(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar la lista.',
        );
      })
      .finally(() => setLoadedFilter(deleted));

  useEffect(() => {
    void fetchPlans(showDeleted);
  }, [showDeleted]);

  const reload = () => {
    setLoadedFilter(null);
    return fetchPlans(showDeleted);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setPriceText('');
    setNumDaysText(String(emptyForm.numDays));
    setFeaturesForm([]);
    setClassesMode('none');
    setMaxClassesText('1');
    setFormError(null);
    setIsCreating(true);
  };

  const openEdit = (plan: Plan) => {
    setForm(plan);
    setPriceText(formatPriceDisplay(plan.price));
    setNumDaysText(String(plan.numDays));
    setFeaturesForm(plan.features ?? []);
    setClassesMode(classesModeOf(plan.maxClasses));
    setMaxClassesText(String(plan.maxClasses || 1));
    setFormError(null);
    setEditing(plan);
  };

  const addFeatureRow = () => {
    setFeaturesForm((prev) => [...prev, { label: '', available: true }]);
  };

  const updateFeatureRow = (index: number, patch: Partial<PlanFeature>) => {
    setFeaturesForm((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
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

    if (
      !form.name.trim() ||
      !priceText ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !numDays ||
      numDays <= 0
    ) {
      setFormError(
        'Nombre, precio y días son obligatorios y deben ser mayores a cero.',
      );
      return;
    }

    const maxClasses =
      classesMode === 'unlimited'
        ? null
        : classesMode === 'none'
          ? 0
          : Number(maxClassesText);

    if (
      classesMode === 'limited' &&
      (!Number.isInteger(maxClasses) || Number(maxClasses) < 1)
    ) {
      setFormError(
        'La cantidad de clases incluidas tiene que ser un número entero mayor a cero.',
      );
      return;
    }

    const features = featuresForm
      .map((f) => ({ ...f, label: f.label.trim() }))
      .filter((f) => f.label.length > 0);
    const payload: Plan = {
      ...form,
      name: form.name.trim(),
      price,
      numDays,
      features,
      maxClasses,
    };

    setIsSaving(true);
    try {
      if (isCreating) {
        await createPlan(payload);
      } else {
        await updatePlan(payload);
      }
      closeModal();
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.');
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
      await reload();
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'No se pudo completar la acción.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Plan>[] = [
    {
      header: 'Nombre',
      cell: (p) => (
        <span className="flex items-center gap-2">
          {p.name}
          {p.highlighted && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Más popular
            </span>
          )}
        </span>
      ),
    },
    { header: 'Precio', cell: (p) => `$${formatPriceDisplay(p.price)}` },
    { header: 'Días', cell: (p) => p.numDays },
    {
      header: 'Clases',
      cell: (p) => classAllowanceLabel(p.maxClasses, 'short'),
    },
    {
      header: 'Acciones',
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
            aria-label={
              showDeleted ? `Restaurar ${p.name}` : `Eliminar ${p.name}`
            }
            className="rounded-lg p-1.5 text-text-muted hover:text-red-400"
          >
            {showDeleted ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
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
          <Button
            size="sm"
            onClick={openCreate}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Cambiar el precio no afecta a las suscripciones ya activas, solo a las
        nuevas.
      </p>

      <FormAlert type="error" message={loadError ?? listError} />

      <DataTable
        columns={columns}
        rows={plans}
        rowKey={(p) => p.id ?? p.name}
        isLoading={isLoading}
        emptyMessage={
          showDeleted
            ? 'No hay planes eliminados.'
            : 'Todavía no hay planes cargados.'
        }
      />

      {(isCreating || editing) && (
        <Modal
          title={isCreating ? 'Agregar plan' : 'Editar plan'}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <FormAlert type="error" message={formError} />
            <InputField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <InputField
              label="Descripción"
              value={form.description ?? ''}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
                {priceText &&
                  Number.isFinite(parsePriceInput(priceText)) &&
                  parsePriceInput(priceText) > 0 && (
                    <p className="mt-1 text-xs text-primary">
                      Se va a guardar como $
                      {formatPriceDisplay(parsePriceInput(priceText))}
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

            <div>
              <span className="font-body text-xs sm:text-sm font-medium text-text">
                Clases grupales incluidas
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {CLASSES_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setClassesMode(mode.value)}
                    aria-pressed={classesMode === mode.value}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      classesMode === mode.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              {classesMode === 'limited' && (
                <div className="mt-3 max-w-40">
                  <InputField
                    label="Cantidad"
                    type="number"
                    min={1}
                    value={maxClassesText}
                    onChange={(e) => setMaxClassesText(e.target.value)}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-text-muted">
                Cuántas clases distintas puede tener a la vez un socio con este
                plan. Con "Sin clases" el plan solo da acceso al gimnasio.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.highlighted ?? false}
                onChange={(e) =>
                  setForm({ ...form, highlighted: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-text">
                Destacar como "Más popular"
                <span className="mt-0.5 block text-xs text-text-muted">
                  Muestra la etiqueta en la página de planes. Se puede destacar
                  más de un plan.
                </span>
              </span>
            </label>

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
                  Sin características cargadas todavía. "Agregar" para sumar la
                  primera.
                </p>
              ) : (
                <ul className="space-y-2">
                  {featuresForm.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateFeatureRow(index, {
                            available: !feature.available,
                          })
                        }
                        aria-label={
                          feature.available
                            ? 'Marcar como no incluida'
                            : 'Marcar como incluida'
                        }
                        aria-pressed={feature.available}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          feature.available
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-text-muted'
                        }`}
                      >
                        {feature.available ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={feature.label}
                        onChange={(e) =>
                          updateFeatureRow(index, { label: e.target.value })
                        }
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
                El ícono a la izquierda marca si la característica está incluida
                en el plan o no.
              </p>
            </div>

            {/* Editing only: a duration needs a planId, and a plan being
                created has none until it is saved. */}
            {editing?.id && <PlanDurationsField planId={editing.id} />}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="secondary"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={showDeleted ? 'Restaurar plan' : 'Eliminar plan'}
          description={
            showDeleted
              ? `"${pendingDelete.name}" volverá a estar disponible.`
              : `"${pendingDelete.name}" se va a dar de baja (baja lógica) — se puede restaurar después.`
          }
          confirmLabel={showDeleted ? 'Restaurar' : 'Eliminar'}
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
