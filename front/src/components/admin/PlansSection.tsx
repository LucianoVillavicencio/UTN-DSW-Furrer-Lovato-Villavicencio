import { useEffect, useState } from "react";
import { Pencil, Trash2, RotateCcw, Plus } from "lucide-react";
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
import type { Plan } from "../../types/plan";

const emptyForm: Plan = { name: "", description: "", price: 0, numDays: 30 };

const PlansSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Plan>(emptyForm);
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
    setFormError(null);
    setIsCreating(true);
  };

  const openEdit = (plan: Plan) => {
    setForm(plan);
    setFormError(null);
    setEditing(plan);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.name.trim() || form.price <= 0 || form.numDays <= 0) {
      setFormError("Nombre, precio y días son obligatorios y deben ser mayores a cero.");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createPlan(form);
      } else {
        await updatePlan(form);
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
    { header: "Precio", cell: (p) => `$${p.price}` },
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
              <InputField
                label="Precio"
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
              <InputField
                label="Días"
                type="number"
                value={form.numDays || ""}
                onChange={(e) => setForm({ ...form, numDays: Number(e.target.value) })}
              />
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
