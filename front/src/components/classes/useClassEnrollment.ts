import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ClassSession } from '../../types/classSession';
import type { TypeClass } from '../../types/typeClass';
import type { MyEnrollments } from '../../types/classRegistration';

import { useAuth } from '../../context/useAuth';
import { getClass } from '../../services/class.service';
import { getClassSession } from '../../services/classSession.service';
import { getTypeClass } from '../../services/typeClass.service';
import {
  getMyEnrollments,
  enrollInClass,
  changeMyClass,
  cancelEnrollment,
} from '../../services/classRegistration.service';

import { normalizeText, toMasterClassData } from './master-classes.data';
import { formatTimeOfDay } from '../../lib/weekday';
import type { MasterClassData } from './master-classes.data';
import { groupSessionsByHour, type ClassHour } from './class-hours';

export const useClassEnrollment = () => {
  const [masterClasses, setMasterClasses] = useState<MasterClassData[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classTypes, setClassTypes] = useState<TypeClass[]>([]);
  // What this member holds and what their plan allows, straight from the
  // backend: the same rules that will accept or refuse the request, so the page
  // never offers an action that is going to bounce.
  const [myEnrollments, setMyEnrollments] = useState<MyEnrollments | null>(
    null,
  );

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

      const [fetchedClasses, fetchedSessions, fetchedTypes, fetchedMine] =
        await Promise.allSettled([
          getClass(),
          getClassSession(),
          getTypeClass(),
          // Enrollments only make sense for a signed-in user.
          isAuthenticated ? getMyEnrollments() : Promise.resolve(null),
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

      if (fetchedMine.status === 'fulfilled') {
        setMyEnrollments(fetchedMine.value);
      }

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

  // Memoised because the callbacks below depend on it: a fresh [] on every
  // render would rebuild them each time.
  const enrollments = useMemo(
    () => myEnrollments?.enrollments ?? [],
    [myEnrollments],
  );
  const maxClasses = myEnrollments?.maxClasses ?? 0;
  const hasActivePlan = myEnrollments?.hasActivePlan ?? false;
  // At the cap the only way into another hour is a change, which is what the
  // member is offered instead of an enroll button that would be refused.
  const isAtAllowance =
    maxClasses !== null && enrollments.length >= maxClasses && maxClasses > 0;

  // Enrolled in an hour means holding the spot on every day it runs.
  const isEnrolledInHour = useCallback(
    (hour: ClassHour | null) => {
      if (!hour) return false;
      return enrollments.some(
        (e) => e.classId === hour.classId && e.startTime === hour.startTime,
      );
    },
    [enrollments],
  );

  // Applies what the backend answered: it returns the member's whole state, so
  // the page never has to guess how a rule resolved.
  const applyResult = useCallback(
    async (result: MyEnrollments, message: string) => {
      setMyEnrollments(result);
      setActionFeedback({ type: 'success', message });
      // Capacity moved for everyone, not just for this member.
      const refreshed = await getClassSession().catch(() => null);
      if (refreshed) setSessions(refreshed);
    },
    [],
  );

  const runAction = useCallback(
    async (action: () => Promise<MyEnrollments>, message: string) => {
      setActionLoading(true);
      setActionFeedback(null);
      try {
        await applyResult(await action(), message);
      } catch (err) {
        setActionFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'No se pudo completar la acción.',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [applyResult],
  );

  // Enrolling books every weekly turno of the chosen class + hour: the member
  // keeps that spot each week and only comes back to change it.
  const handleEnrollHour = useCallback(
    (hour: ClassHour) =>
      runAction(
        () => enrollInClass(hour.classId, hour.startTime),
        '¡Listo! Tenés tu lugar en ese horario todas las semanas.',
      ),
    [runAction],
  );

  // Switching spends one of the monthly changes when the plan is limited. The
  // group being replaced is passed explicitly so a plan with several classes
  // knows which one to release.
  const handleChangeToHour = useCallback(
    (hour: ClassHour, group?: string) =>
      runAction(
        () =>
          changeMyClass(
            hour.classId,
            hour.startTime,
            group ?? enrollments[0]?.group,
          ),
        'Cambiamos tu clase. El nuevo horario queda reservado todas las semanas.',
      ),
    [runAction, enrollments],
  );

  const handleCancelHour = useCallback(
    (hour: ClassHour) => {
      const mine = enrollments.find(
        (e) => e.classId === hour.classId && e.startTime === hour.startTime,
      );
      if (!mine) return Promise.resolve();
      return runAction(
        () => cancelEnrollment(mine.group),
        'Cancelamos tu inscripción a ese horario.',
      );
    },
    [runAction, enrollments],
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
    myEnrollments,
    isAtAllowance,
    handleEnrollHour,
    handleChangeToHour,
    handleCancelHour,
    currentUser,
    actionLoading,
    actionFeedback,
    setActionFeedback,
  };
};
