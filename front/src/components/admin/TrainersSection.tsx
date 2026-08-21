import { useEffect, useState } from 'react';
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import {
  getTrainers,
  getDeletedTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  restoreTrainer,
} from '../../services/trainer.service';
import type { Trainer } from '../../types/trainer';

const emptyForm: Trainer = {
  dni: 0,
  name: '',
  surname: '',
  email: '',
  phone: '',
  speciality: '',
};

const TrainersSection = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Trainer | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Trainer>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Trainer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = showDeleted
        ? await getDeletedTrainers()
        : await getTrainers();
      setTrainers(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'No se pudo cargar la lista.',
      );
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

  const openEdit = (trainer: Trainer) => {
    setForm(trainer);
    setFormError(null);
    setEditing(trainer);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
      setFormError('Nombre, apellido y email son obligatorios.');
      return;
    }
    if (isCreating && !form.dni) {
      setFormError('El DNI es obligatorio.');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createTrainer(form);
      } else {
        await updateTrainer(form);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setListError(null);
    try {
      if (showDeleted) {
        await restoreTrainer(pendingDelete.dni);
      } else {
        await deleteTrainer(pendingDelete.dni);
      }
      setPendingDelete(null);
      await load();
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'No se pudo completar la acción.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Trainer>[] = [
    { header: 'DNI', cell: (t) => t.dni },
    { header: 'Nombre', cell: (t) => `${t.name} ${t.surname}` },
    { header: 'Especialidad', cell: (t) => t.speciality || '—' },
    { header: 'Email', cell: (t) => t.email },
    {
      header: 'Acciones',
      cell: (t) => (
        <div className="flex gap-2">
          {!showDeleted && (
            <button
              type="button"
              onClick={() => openEdit(t)}
              aria-label={`Editar ${t.name}`}
              className="rounded-lg p-1.5 text-text-muted hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPendingDelete(t)}
            aria-label={
              showDeleted ? `Restaurar ${t.name}` : `Eliminar ${t.name}`
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
        <h3 className="font-display text-lg font-semibold text-text">
          Entrenadores
        </h3>
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

      <FormAlert type="error" message={loadError ?? listError} />

      <DataTable
        columns={columns}
        rows={trainers}
        rowKey={(t) => t.dni}
        isLoading={isLoading}
        emptyMessage={
          showDeleted
            ? 'No hay entrenadores eliminados.'
            : 'Todavía no hay entrenadores cargados.'
        }
      />

      {(isCreating || editing) && (
        <Modal
          title={isCreating ? 'Agregar entrenador' : 'Editar entrenador'}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <FormAlert type="error" message={formError} />
            <InputField
              label="DNI"
              type="number"
              value={form.dni || ''}
              disabled={!isCreating}
              onChange={(e) =>
                setForm({ ...form, dni: Number(e.target.value) })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <InputField
                label="Apellido"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
              />
            </div>
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <InputField
              label="Teléfono"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <InputField
              label="Especialidad"
              value={form.speciality ?? ''}
              onChange={(e) => setForm({ ...form, speciality: e.target.value })}
            />
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
          title={showDeleted ? 'Restaurar entrenador' : 'Eliminar entrenador'}
          description={
            showDeleted
              ? `"${pendingDelete.name} ${pendingDelete.surname}" volverá a estar disponible.`
              : `"${pendingDelete.name} ${pendingDelete.surname}" se va a dar de baja (baja lógica) — se puede restaurar después.`
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

export default TrainersSection;
