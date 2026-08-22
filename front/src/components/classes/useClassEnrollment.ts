import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ClassSession } from '../../types/classSession';
import type { TypeClass } from '../../types/typeClass';
import type { ClassRegistration } from '../../types/classRegistration';

import { useAuth } from '../../context/useAuth';
import { getClass } from '../../services/class.service';
import { getClassSession } from '../../services/classSession.service';
import { getTypeClass } from '../../services/typeClass.service';
import {
  createClassRegistration,
  getClassRegistration,
  deleteClassRegistration,
} from '../../services/classRegistration.service';
import { getMySubscription } from '../../services/subscription.service';

import { normalizeText, toMasterClassData } from './master-classes.data';
import { formatTimeOfDay } from '../../lib/weekday';
import type { MasterClassData } from './master-classes.data';
import { groupSessionsByHour, type ClassHour } from './class-hours';

export const useClassEnrollment = () => {
  const [masterClasses, setMasterClasses] = useState<MasterClassData[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classTypes, setClassTypes] = useState<TypeClass[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<
    ClassRegistration[]
  >([]);
  // A membership is required to enroll, so the button offers the plans page
  // instead of a request the backend would reject.
  const [hasActivePlan, setHasActivePlan] = useState(false);

  // The user comes from AuthContext, whose token is already validated, rather
  // than from raw localStorage.
  const { user: currentUser, isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters state
  const [selectedTypeId, setSelectedTypeId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // EXPANDED VIEW STATE
  const [activeExpandedClass, setActiveExpandedClass] =
    useState<MasterClassData | null>(null);
  // A member picks an hour, not a date: the enrollment covers every weekday
  // that class runs at that hour, week after week.
  const [selectedHour, setSelectedHour] = useState<ClassHour | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(null);

      const [
        fetchedClasses,
        fetchedSessions,
        fetchedTypes,
        fetchedRegistrations,
        fetchedSubscription,
      ] = await Promise.allSettled([
        getClass(),
        getClassSession(),
        getTypeClass(),
        // Registrations and the subscription only make sense for a signed-in
        // user.
        isAuthenticated ? getClassRegistration() : Promise.resolve([]),
        isAuthenticated ? getMySubscription() : Promise.resolve(null),
      ]);

      // The class catalogue comes from the backend with no stand-in data: if it
      // fails the error is shown instead of inventing classes that do not exist.
      const classesFromApi =
        fetchedClasses.status === 'fulfilled' &&
        Array.isArray(fetchedClasses.value)
          ? fetchedClasses.value.map(toMasterClassData)
          : [];

      if (fetchedClasses.status === 'rejected') {
        setLoadError(
          fetchedClasses.reason instanceof Error
            ? fetchedClasses.reason.message
            : 'Error al obtener lista de clases',
        );
      }

      setMasterClasses(classesFromApi);

      // Only the weekly turnos an admin actually published. There used to be a
      // generated week grid as a stand-in here, but those slots do not exist in
      // the database: enrolling in one fails, so it advertised a schedule that
      // could not be booked. An empty grid is the honest answer.
      setSessions(
        fetchedSessions.status === 'fulfilled' &&
          Array.isArray(fetchedSessions.value)
          ? fetchedSessions.value
          : [],
      );

      // Filter disciplines: the class-type endpoint, falling back to the types
      // already embedded in the classes that were fetched.
      if (
        fetchedTypes.status === 'fulfilled' &&
        Array.isArray(fetchedTypes.value) &&
        fetchedTypes.value.length > 0
      ) {
        setClassTypes(fetchedTypes.value);
      } else {
        const typesFromClasses = new Map<number, TypeClass>();
        classesFromApi.forEach((cls) => {
          if (cls.typeClassId)
            typesFromClasses.set(cls.typeClassId, cls.typeClass);
        });
        setClassTypes([...typesFromClasses.values()]);
      }

      if (
        fetchedRegistrations.status === 'fulfilled' &&
        Array.isArray(fetchedRegistrations.value)
      ) {
        setUserRegistrations(fetchedRegistrations.value);
      }

      setHasActivePlan(
        fetchedSubscription.status === 'fulfilled' &&
          !!fetchedSubscription.value,
      );

      setIsLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);

  // Filter class cards with accent-normalization
  const filteredMasterClasses = useMemo(() => {
    return masterClasses.filter((cls) => {
      if (selectedTypeId !== 'ALL' && cls.typeClassId !== selectedTypeId)
        return false;
      if (searchQuery.trim()) {
        const normQuery = normalizeText(searchQuery);
        const normTitle = normalizeText(cls.name);
        const normDesc = normalizeText(cls.description);
        const normCategory = normalizeText(cls.typeClass?.name);
        const normProf = normalizeText(
          `${cls.trainer?.name || ''} ${cls.trainer?.surname || ''}`,
        );

        const matches =
          normTitle.includes(normQuery) ||
          normDesc.includes(normQuery) ||
          normCategory.includes(normQuery) ||
          normProf.includes(normQuery);

        if (!matches) return false;
      }
      return true;
    });
  }, [masterClasses, selectedTypeId, searchQuery]);

  // The published schedule of every class, so a card shows the days and hours
  // that exist instead of a generic "Lunes a Sábado".
  const scheduleByClass = useMemo(() => {
    const byClass = new Map<number, { weekdays: number[]; hours: string[] }>();
    for (const session of sessions) {
      const classId = session.classId ?? session.class?.id;
      if (!classId) continue;
      const entry = byClass.get(classId) ?? { weekdays: [], hours: [] };
      if (!entry.weekdays.includes(session.weekday)) {
        entry.weekdays.push(session.weekday);
      }
      const hour = formatTimeOfDay(session.startTime);
      if (!entry.hours.includes(hour)) entry.hours.push(hour);
      byClass.set(classId, entry);
    }
    for (const entry of byClass.values()) {
      entry.weekdays.sort((a, b) => a - b);
      entry.hours.sort();
    }
    return byClass;
  }, [sessions]);

  const scheduleOfClass = useCallback(
    (classId: number) =>
      scheduleByClass.get(classId) ?? { weekdays: [], hours: [] },
    [scheduleByClass],
  );

  // The weekly hours of the expanded class, each covering the days it runs.
  const hoursForActiveClass = useMemo(
    () =>
      activeExpandedClass
        ? groupSessionsByHour(sessions, activeExpandedClass.id)
        : [],
    [sessions, activeExpandedClass],
  );

  const activeClassHasSessions = hoursForActiveClass.length > 0;

  // The registrations of the signed-in user that are still active.
  const myRegistrations = useMemo(() => {
    if (!currentUser) return [];
    const dni = Number(currentUser.dni);
    return userRegistrations.filter(
      (reg) => Number(reg.userDni) === dni && !reg.deleted,
    );
  }, [currentUser, userRegistrations]);

  // Enrolled in an hour means holding the spot for the days it runs, so any
  // registration in the group answers it.
  const isEnrolledInHour = useCallback(
    (hour: ClassHour | null) => {
      if (!hour) return false;
      const ids = new Set(hour.sessions.map((s) => Number(s.id)));
      return myRegistrations.some((reg) => ids.has(Number(reg.classSessionId)));
    },
    [myRegistrations],
  );

  // Enrolling takes every weekly turno of the chosen class + hour: the member
  // keeps the same spot each week and only comes back to change class.
  const handleEnrollHour = useCallback(
    async (hour: ClassHour) => {
      if (!currentUser) return;

      const userDni = Number(currentUser.dni);
      if (!Number.isFinite(userDni) || userDni <= 0) {
        setActionFeedback({
          type: 'error',
          message:
            'No se pudo verificar tu DNI. Por favor vuelve a iniciar sesión.',
        });
        return;
      }

      if (hour.freeSpots <= 0) {
        setActionFeedback({
          type: 'error',
          message: 'No hay cupos disponibles para este horario.',
        });
        return;
      }

      setActionLoading(true);
      setActionFeedback(null);

      try {
        const created: ClassRegistration[] = [];
        for (const session of hour.sessions) {
          created.push(
            await createClassRegistration({
              userDni,
              classSessionId: Number(session.id),
              date: new Date().toISOString(),
              state: 'confirmada',
            }),
          );
        }

        setUserRegistrations((prev) => [...prev, ...created]);
        const enrolledIds = new Set(hour.sessions.map((s) => Number(s.id)));
        setSessions((prev) =>
          prev.map((s) =>
            enrolledIds.has(Number(s.id))
              ? {
                  ...s,
                  availableSpots: Math.max(0, (s.availableSpots ?? 1) - 1),
                }
              : s,
          ),
        );

        setActionFeedback({
          type: 'success',
          message: '¡Listo! Tenés tu lugar en ese horario todas las semanas.',
        });
      } catch (err) {
        setActionFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Error al procesar la inscripción',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser],
  );

  const handleCancelHour = useCallback(
    async (hour: ClassHour) => {
      const ids = new Set(hour.sessions.map((s) => Number(s.id)));
      const mine = myRegistrations.filter((reg) =>
        ids.has(Number(reg.classSessionId)),
      );
      if (mine.length === 0) return;

      setActionLoading(true);
      setActionFeedback(null);

      try {
        for (const registration of mine) {
          if (registration.id) {
            await deleteClassRegistration(registration.id);
          }
        }

        const cancelled = new Set(mine.map((reg) => reg.id));
        setUserRegistrations((prev) =>
          prev.filter((reg) => !cancelled.has(reg.id)),
        );
        setSessions((prev) =>
          prev.map((s) =>
            ids.has(Number(s.id))
              ? {
                  ...s,
                  availableSpots: Math.min(
                    s.maxCapacity,
                    (s.availableSpots ?? 0) + 1,
                  ),
                }
              : s,
          ),
        );

        setActionFeedback({
          type: 'success',
          message: 'Cancelamos tu inscripción a ese horario.',
        });
      } catch (err) {
        setActionFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Error al cancelar la inscripción',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [myRegistrations],
  );

  return {
    isLoading,
    loadError,
    classTypes,
    selectedTypeId,
    setSelectedTypeId,
    searchQuery,
    setSearchQuery,
    filteredMasterClasses,
    scheduleOfClass,
    activeExpandedClass,
    setActiveExpandedClass,
    hoursForActiveClass,
    activeClassHasSessions,
    selectedHour,
    setSelectedHour,
    isEnrolledInHour,
    hasActivePlan,
    handleEnrollHour,
    handleCancelHour,
    currentUser,
    actionLoading,
    actionFeedback,
    setActionFeedback,
  };
};
