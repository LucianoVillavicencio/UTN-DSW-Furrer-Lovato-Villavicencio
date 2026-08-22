import { useState } from 'react';
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import ConfirmDialog from './ConfirmDialog';
import TrainerForm from './TrainerForm';
import { useAdminTrainers } from './useAdminTrainers';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import type { Trainer } from '../../types/trainer';

const TrainersSection = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const {
    trainers,
    isLoading,
    loadError,
    listError,
    setListError,
    reload,
    save,
    remove,
  } = useAdminTrainers(showDeleted);

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trainer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeModal = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setListError(null);
    try {
      await remove(pendingDelete);
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

  const columns: DataTableColumn<Trainer>[] = [
    {
      header: '',
      cell: (t) => {
        const photo = resolveMediaUrl(t.photoUrl);
        return photo ? (
          <img
            src={photo}
            alt={`Foto de ${t.name}`}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {`${t.name.charAt(0)}${t.surname.charAt(0)}`.toUpperCase()}
          </span>
        );
      },
    },
    { header: 'DNI', cell: (t) => t.dni },
    { header: 'Nombre', cell: (t) => `${t.name} ${t.surname}` },
    { header: 'Especialidad', cell: (t) => t.speciality ?? '—' },
    {
      header: 'Instagram',
      cell: (t) => (t.instagram ? `@${t.instagram}` : '—'),
    },
    {
      header: 'Certificaciones',
      cell: (t) => t.certifications?.length ?? 0,
    },
    {
      header: 'Acciones',
      cell: (t) => (
        <div className="flex gap-2">
          {!showDeleted && (
            <button
              type="button"
              onClick={() => setEditing(t)}
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
            onClick={() => setIsCreating(true)}
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
        <TrainerForm
          trainer={editing}
          save={save}
          reload={reload}
          onClose={closeModal}
        />
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
