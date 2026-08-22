import { useEffect, useState } from 'react';
import {
  getClassSession,
  getDeletedClassSessions,
  createClassSession,
  updateClassSession,
  deleteClassSession,
  restoreClassSession,
} from '../../services/classSession.service';
import { getClass } from '../../services/class.service';
import type { ClassSession } from '../../types/classSession';
import type { Class } from '../../types/class';
import type { ClassSessionFormState } from './class-session-form';

// Everything the Turnos section does with the API: the list, the class picker's
// options, and the create/update/delete/restore round trips. The section itself
// is left with the markup.
export const useClassSessions = (showDeleted: boolean) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  // "Loading" is derived from the filter the list in state came from, so
  // toggling the deleted filter shows the spinner without this component
  // writing state from inside an effect.
  const [loadedFilter, setLoadedFilter] = useState<boolean | null>(null);
  const isLoading = loadedFilter !== showDeleted;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Every setState lives in an async callback, so the effect below only starts
  // the requests instead of updating state while React renders.
  const fetchSessions = (deleted: boolean) =>
    Promise.all([
      deleted ? getDeletedClassSessions() : getClassSession(),
      getClass().catch(() => []),
    ])
      .then(([sessionsData, classesData]) => {
        setSessions(
          [...sessionsData].sort((a, b) =>
            a.dateTime < b.dateTime ? -1 : a.dateTime > b.dateTime ? 1 : 0,
          ),
        );
        setClasses(classesData);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar la lista.',
        );
      })
      .finally(() => setLoadedFilter(deleted));

  useEffect(() => {
    void fetchSessions(showDeleted);
  }, [showDeleted]);

  const reload = () => {
    setLoadedFilter(null);
    return fetchSessions(showDeleted);
  };

  // Returns null on success, or the message to show in the form.
  const save = async (
    form: ClassSessionFormState,
    editing: ClassSession | null,
  ): Promise<string | null> => {
    const maxCapacity = Number(form.maxCapacity);
    if (!form.classId || !form.date || !form.time) {
      return 'Clase, fecha y hora son obligatorias.';
    }
    if (!Number.isFinite(maxCapacity) || maxCapacity < 1) {
      return 'El cupo máximo tiene que ser mayor a cero.';
    }

    // No trailing Z, so the browser reads it as the local time the admin typed.
    const dateTime = new Date(`${form.date}T${form.time}:00`).toISOString();

    setIsSaving(true);
    try {
      if (editing) {
        await updateClassSession({
          id: editing.id,
          classId: form.classId,
          dateTime,
          maxCapacity,
          availableSpots: editing.availableSpots,
        });
      } else {
        await createClassSession({
          classId: form.classId,
          dateTime,
          maxCapacity,
        });
      }
      await reload();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'No se pudo guardar.';
    } finally {
      setIsSaving(false);
    }
  };

  const removeOrRestore = async (
    session: ClassSession,
  ): Promise<string | null> => {
    if (!session.id) return null;
    setIsDeleting(true);
    try {
      if (showDeleted) {
        await restoreClassSession(session.id);
      } else {
        await deleteClassSession(session.id);
      }
      await reload();
      return null;
    } catch (err) {
      return err instanceof Error
        ? err.message
        : 'No se pudo completar la acción.';
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    sessions,
    classes,
    isLoading,
    loadError,
    isSaving,
    isDeleting,
    save,
    removeOrRestore,
  };
};
