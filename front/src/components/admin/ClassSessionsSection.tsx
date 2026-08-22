import { useState } from 'react';
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import ClassSessionForm from './ClassSessionForm';
import {
  emptyClassSessionForm,
  type ClassSessionFormState,
} from './class-session-form';
import { useClassSessions } from './useClassSessions';
import type { ClassSession } from '../../types/classSession';
import { formatTimeOfDay, weekdayLabel } from '../../lib/weekday';

// Editing moves one slot, so the lists the create grid fills hold exactly one
// value each.
const toFormState = (session: ClassSession): ClassSessionFormState => ({
  id: session.id,
  classId: session.classId,
  weekdays: [session.weekday],
  times: [formatTimeOfDay(session.startTime)],
  maxCapacity: String(session.maxCapacity),
});

const ClassSessionsSection = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const {
    sessions,
    classes,
    isLoading,
    loadError,
    isSaving,
    isDeleting,
    save,
    removeOrRestore,
  } = useClassSessions(showDeleted);

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [form, setForm] = useState<ClassSessionFormState>(
    emptyClassSessionForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClassSession | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    const message = await save(form, editing);
    setFormError(message);
    if (!message) closeModal();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const message = await removeOrRestore(pendingDelete);
    setListError(message);
    if (!message) setPendingDelete(null);
  };

  const className = (s: ClassSession) =>
    s.class?.name ??
    classes.find((c) => c.id === s.classId)?.name ??
    `#${s.classId}`;

  const columns: DataTableColumn<ClassSession>[] = [
    { header: 'Clase', cell: className },
    { header: 'Día', cell: (s) => weekdayLabel(s.weekday) },
    { header: 'Hora', cell: (s) => `${formatTimeOfDay(s.startTime)} hs` },
    {
      header: 'Cupo',
      cell: (s) => `${s.availableSpots ?? s.maxCapacity} / ${s.maxCapacity}`,
    },
    {
      header: 'Acciones',
      cell: (s) => (
        <div className="flex gap-2">
          {!showDeleted && (
            <button
              type="button"
              onClick={() => {
                setForm(toFormState(s));
                setFormError(null);
                setEditing(s);
              }}
              aria-label={`Editar turno de ${className(s)}`}
              className="rounded-lg p-1.5 text-text-muted hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPendingDelete(s)}
            aria-label={
              showDeleted
                ? `Restaurar turno de ${className(s)}`
                : `Eliminar turno de ${className(s)}`
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
        <h3 className="font-display text-lg font-semibold text-text">Turnos</h3>
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
            onClick={() => {
              setForm(emptyClassSessionForm);
              setFormError(null);
              setIsCreating(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <FormAlert type="error" message={loadError ?? listError} />
      {!isLoading && classes.length === 0 && (
        <FormAlert
          type="warning"
          message="No hay clases cargadas todavía — creá una en la pestaña Clases antes de agregar turnos."
        />
      )}

      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(s) => s.id ?? `${s.classId}-${s.weekday}-${s.startTime}`}
        isLoading={isLoading}
        emptyMessage={
          showDeleted
            ? 'No hay turnos eliminados.'
            : 'Todavía no hay turnos cargados. Sin turnos, la página de clases no puede ofrecer inscripciones.'
        }
      />

      {(isCreating || editing) && (
        <Modal
          title={isCreating ? 'Agregar turnos semanales' : 'Editar turno'}
          onClose={closeModal}
        >
          <ClassSessionForm
            form={form}
            classes={classes}
            error={formError}
            isSaving={isSaving}
            isEditing={!!editing}
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={showDeleted ? 'Restaurar turno' : 'Eliminar turno'}
          description={
            showDeleted
              ? `¿Restaurar el turno de ${className(pendingDelete)}?`
              : `¿Eliminar el turno de ${className(pendingDelete)}? Los socios inscriptos en ese horario pierden ese día de la semana.`
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

export default ClassSessionsSection;
