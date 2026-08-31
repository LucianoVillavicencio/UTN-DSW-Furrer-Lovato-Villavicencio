import { useEffect, useState } from 'react';
import {
  getClassSession,
  getDeletedClassSessions,
  createWeeklyClassSessions,
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
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Every setState lives in an async callback, so the effect below only starts
  // the requests instead of updating state while React renders.
  const fetchSessions = (deleted: boolean) =>
    Promise.all([
      deleted ? getDeletedClassSessions() : getClassSession(),
      // Tolerated, not swallowed: an empty class list still lets the admin read
      // the turnos table. But it is what makes the picker empty and the form
      // then refuse the save, so it has to say so instead of looking like an
      // empty database.
      getClass().catch((err: unknown) => {
        console.warn('Could not load the class list for the turnos picker', err);
        setOptionsError(
          'No se pudieron cargar las clases. El selector de clase va a estar vacío.',
        );
        return [] as Class[];
      }),
    ])
      .then(([sessionsData, classesData]) => {
        setSessions(
          [...sessionsData].sort(
            (a, b) =>
              a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
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

  // Returns null on success, or the message to show in the form. Creating goes
  // through the weekly endpoint so every day × hour combination is one request;
  // editing moves a single existing slot.
  const save = async (
    form: ClassSessionFormState,
    editing: ClassSession | null,
  ): Promise<string | null> => {
    const maxCapacity = Number(form.maxCapacity);
    const times = form.times.map((t) => t.trim()).filter((t) => t.length > 0);

    if (!form.classId || form.weekdays.length === 0 || times.length === 0) {
      return 'Clase, día y horario son obligatorios.';
    }
    if (!Number.isFinite(maxCapacity) || maxCapacity < 1) {
      return 'El cupo máximo tiene que ser mayor a cero.';
    }

    setIsSaving(true);
    try {
      if (editing) {
        await updateClassSession({
          id: editing.id,
          classId: form.classId,
          weekday: form.weekdays[0],
          startTime: times[0],
          maxCapacity,
          availableSpots: editing.availableSpots,
        });
      } else {
        const result = await createWeeklyClassSessions({
          classId: form.classId,
          weekdays: form.weekdays,
          times,
          maxCapacity,
        });
        if (result.created === 0) {
          return 'Esos turnos ya existían — no se creó ninguno nuevo.';
        }
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
    optionsError,
    isSaving,
    isDeleting,
    save,
    removeOrRestore,
  };
};
