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

import {
  generateFullWeekSessions,
  getLocalYMD,
  normalizeText,
  toMasterClassData,
  type MasterClassData,
} from './master-classes.data';

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
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null,
  );

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

      // Real sessions from the backend; while none are loaded yet, a week grid is
      // generated over the classes that do exist.
      if (
        fetchedSessions.status === 'fulfilled' &&
        Array.isArray(fetchedSessions.value) &&
        fetchedSessions.value.length > 0
      ) {
        setSessions(fetchedSessions.value);
      } else {
        setSessions(generateFullWeekSessions(classesFromApi));
      }

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

  // Whether the user is already enrolled in a given session.
  const isEnrolledInSession = useCallback(
    (sessionId?: number) => {
      if (!currentUser || !sessionId) return false;
      const userDniNum = Number(currentUser.dni);
      return userRegistrations.some(
        (ins) =>
          Number(ins.userDni) === userDniNum &&
          Number(ins.classSessionId) === Number(sessionId) &&
          !ins.deleted,
      );
    },
    [currentUser, userRegistrations],
  );

  // The registration matching a session, if there is one.
  const getRegistrationForSession = useCallback(
    (sessionId?: number) => {
      if (!currentUser || !sessionId) return null;
      const userDniNum = Number(currentUser.dni);
      return userRegistrations.find(
        (ins) =>
          Number(ins.userDni) === userDniNum &&
          Number(ins.classSessionId) === Number(sessionId) &&
          !ins.deleted,
      );
    },
    [currentUser, userRegistrations],
  );

  // Available sessions for active expanded class on selected day (timezone-safe getLocalYMD)
  const sessionsForActiveExpandedDay = useMemo(() => {
    if (!activeExpandedClass) return [];
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + selectedDayOffset);
    const targetDateStr = getLocalYMD(targetDateObj);

    return sessions
      .filter((t) => {
        const isSameClass =
          (t.classId ?? t.class?.id) === activeExpandedClass.id;
        const tDateStr = getLocalYMD(t.dateTime);
        return isSameClass && tDateStr === targetDateStr;
      })
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
  }, [activeExpandedClass, selectedDayOffset, sessions]);

  // Enrollment handler with front-end capacity & duplicate validation
  const handleEnrollSession = useCallback(
    async (targetSession: ClassSession) => {
      if (!currentUser || !targetSession?.id) return;

      // Check capacity limit
      const freeSpots =
        targetSession.availableSpots ?? targetSession.maxCapacity ?? 20;
      if (freeSpots <= 0) {
        setActionFeedback({
          type: 'error',
          message: 'No hay cupos disponibles para este horario.',
        });
        return;
      }

      // Check duplicate enrollment
      if (isEnrolledInSession(targetSession.id)) {
        setActionFeedback({
          type: 'error',
          message: 'Ya estás inscripto en este turno.',
        });
        return;
      }

      const userDniNum = Number(currentUser.dni);
      const sessionIdNum = Number(targetSession.id);

      if (isNaN(userDniNum) || userDniNum <= 0) {
        setActionFeedback({
          type: 'error',
          message:
            'No se pudo verificar tu DNI. Por favor vuelve a iniciar sesión.',
        });
        return;
      }

      setActionLoading(true);
      setActionFeedback(null);

      try {
        const newRegistration: ClassRegistration =
          await createClassRegistration({
            userDni: userDniNum,
            classSessionId: sessionIdNum,
            date: new Date().toISOString(),
            state: 'confirmada',
          });

        setUserRegistrations((prev) => [...prev, newRegistration]);
        setSessions((prev) =>
          prev.map((t) =>
            Number(t.id) === sessionIdNum
              ? {
                  ...t,
                  availableSpots: Math.max(0, (t.availableSpots ?? 1) - 1),
                }
              : t,
          ),
        );

        if (selectedSession && Number(selectedSession.id) === sessionIdNum) {
          setSelectedSession((prev: ClassSession | null) =>
            prev
              ? {
                  ...prev,
                  availableSpots: Math.max(0, (prev.availableSpots ?? 1) - 1),
                }
              : null,
          );
        }

        setActionFeedback({
          type: 'success',
          message: '¡Inscripción realizada con éxito para ese horario!',
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Error al procesar la inscripción';
        setActionFeedback({ type: 'error', message: msg });
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser, isEnrolledInSession, selectedSession],
  );

  // Cancel enrollment handler
  const handleCancelSession = useCallback(
    async (targetSession: ClassSession) => {
      const registration = getRegistrationForSession(targetSession.id);
      if (!registration) return;

      setActionLoading(true);
      setActionFeedback(null);

      try {
        if (registration.id) {
          await deleteClassRegistration(registration.id);
        }

        setUserRegistrations((prev) =>
          prev.filter((i) => i !== registration && i.id !== registration.id),
        );
        const sessionIdNum = Number(targetSession.id);

        setSessions((prev) =>
          prev.map((t) =>
            Number(t.id) === sessionIdNum
              ? {
                  ...t,
                  availableSpots: Math.min(
                    t.maxCapacity || 20,
                    (t.availableSpots ?? 0) + 1,
                  ),
                }
              : t,
          ),
        );

        if (selectedSession && Number(selectedSession.id) === sessionIdNum) {
          setSelectedSession((prev: ClassSession | null) =>
            prev
              ? {
                  ...prev,
                  availableSpots: Math.min(
                    prev.maxCapacity || 20,
                    (prev.availableSpots ?? 0) + 1,
                  ),
                }
              : null,
          );
        }

        setActionFeedback({
          type: 'success',
          message: 'Has cancelado tu inscripción para ese horario.',
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Error al cancelar la inscripción';
        setActionFeedback({ type: 'error', message: msg });
      } finally {
        setActionLoading(false);
      }
    },
    [getRegistrationForSession, selectedSession],
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
    activeExpandedClass,
    setActiveExpandedClass,
    selectedDayOffset,
    setSelectedDayOffset,
    sessionsForActiveExpandedDay,
    selectedSession,
    setSelectedSession,
    isEnrolledInSession,
    hasActivePlan,
    handleEnrollSession,
    handleCancelSession,
    currentUser,
    actionLoading,
    actionFeedback,
    setActionFeedback,
  };
};
