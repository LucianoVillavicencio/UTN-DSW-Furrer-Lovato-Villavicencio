import { useEffect, useState } from 'react';
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import {
  getClass,
  getDeletedClasses,
  createClass,
  updateClass,
  deleteClass,
  restoreClass,
} from '../../services/class.service';
import {
  getTypeClass,
  createTypeClass,
} from '../../services/typeClass.service';
import { getTrainers } from '../../services/trainer.service';
import type { Class } from '../../types/class';
import type { TypeClass } from '../../types/typeClass';
import type { Trainer } from '../../types/trainer';

const emptyForm: Class = {
  name: '',
  description: '',
  typeClassId: 0,
  trainerDni: 0,
};

const ClassesSection = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [types, setTypes] = useState<TypeClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Class | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Class>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [typeError, setTypeError] = useState<string | null>(null);
  const [isSavingType, setIsSavingType] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [classesData, typesRes, trainersRes] = await Promise.all([
        showDeleted ? getDeletedClasses() : getClass(),
        getTypeClass().catch(() => []),
        getTrainers().catch(() => []),
      ]);
      setClasses(classesData);
      setTypes(typesRes);
      setTrainers(trainersRes);
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

  const openEdit = (clase: Class) => {
    setForm(clase);
    setFormError(null);
    setEditing(clase);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.typeClassId || !form.trainerDni) {
      setFormError('Nombre, tipo de clase y entrenador son obligatorios.');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createClass(form);
      } else {
        await updateClass(form);
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
    if (!pendingDelete?.id) return;
    setIsDeleting(true);
    setListError(null);
    try {
      if (showDeleted) {
        await restoreClass(pendingDelete.id);
      } else {
        await deleteClass(pendingDelete.id);
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

  const handleAddType = async () => {
    setTypeError(null);
    if (!newTypeName.trim()) {
      setTypeError('El nombre es obligatorio.');
      return;
    }
    setIsSavingType(true);
    try {
      const created = await createTypeClass({ name: newTypeName.trim() });
      setTypes((prev) => [...prev, created]);
      setForm((prev) => ({
        ...prev,
        typeClassId: created.id ?? prev.typeClassId,
      }));
      setNewTypeName('');
      setIsAddingType(false);
    } catch (err) {
      setTypeError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear el tipo de clase.',
      );
    } finally {
      setIsSavingType(false);
    }
  };

  const typeName = (id: number) =>
    types.find((t) => t.id === id)?.name ?? `#${id}`;
  const trainerName = (dni: number) => {
    const t = trainers.find((tr) => tr.dni === dni);
    return t ? `${t.name} ${t.surname}` : `#${dni}`;
  };

  const columns: DataTableColumn<Class>[] = [
    { header: 'Nombre', cell: (c) => c.name },
    { header: 'Tipo', cell: (c) => typeName(c.typeClassId) },
    { header: 'Entrenador', cell: (c) => trainerName(c.trainerDni) },
    {
      header: 'Acciones',
      cell: (c) => (
        <div className="flex gap-2">
          {!showDeleted && (
            <button
              type="button"
              onClick={() => openEdit(c)}
              aria-label={`Editar ${c.name}`}
              className="rounded-lg p-1.5 text-text-muted hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPendingDelete(c)}
            aria-label={
              showDeleted ? `Restaurar ${c.name}` : `Eliminar ${c.name}`
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

  const noOptions = types.length === 0 || trainers.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-text">Clases</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Mostrar eliminadas
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
      {!isLoading && noOptions && (
        <FormAlert
          type="warning"
          message="No hay tipos de clase o entrenadores cargados todavía — creá al menos uno de cada uno antes de agregar una clase."
        />
      )}

      <DataTable
        columns={columns}
        rows={classes}
        rowKey={(c) => c.id ?? c.name}
        isLoading={isLoading}
        emptyMessage={
          showDeleted
            ? 'No hay clases eliminadas.'
            : 'Todavía no hay clases cargadas.'
        }
      />

      {(isCreating || editing) && (
        <Modal
          title={isCreating ? 'Agregar clase' : 'Editar clase'}
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block font-body text-xs sm:text-sm font-medium text-text">
                  Tipo de clase
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingType(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  <Plus className="h-3 w-3" />
                  Nuevo tipo
                </button>
              </div>
              <select
                value={form.typeClassId || ''}
                onChange={(e) =>
                  setForm({ ...form, typeClassId: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Elegir tipo...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
                Entrenador
              </label>
              <select
                value={form.trainerDni || ''}
                onChange={(e) =>
                  setForm({ ...form, trainerDni: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Elegir entrenador...</option>
                {trainers.map((t) => (
                  <option key={t.dni} value={t.dni}>
                    {t.name} {t.surname}
                  </option>
                ))}
              </select>
            </div>

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

      {isAddingType && (
        <Modal
          title="Nuevo tipo de clase"
          onClose={() => setIsAddingType(false)}
        >
          <div className="space-y-4">
            <FormAlert type="error" message={typeError} />
            <InputField
              label="Nombre"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Ej: Funcional, Yoga, Spinning..."
            />
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddType}
                disabled={isSavingType}
                className="flex-1"
              >
                {isSavingType ? 'Guardando...' : 'Crear tipo'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsAddingType(false)}
                disabled={isSavingType}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={showDeleted ? 'Restaurar clase' : 'Eliminar clase'}
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

export default ClassesSection;
