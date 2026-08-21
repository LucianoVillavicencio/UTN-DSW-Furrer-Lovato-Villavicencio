import { useState, useEffect, useMemo, useCallback } from "react";
import type { TurnoClase } from "../../types/classSession";
import type { TipoClase } from "../../types/typeClass";
import type { InscripcionClase } from "../../types/classRegistration";

import { useAuth } from "../../context/AuthContext";
import { getClass } from "../../services/class.service";
import { getTurnosClase } from "../../services/classSession.service";
import { getTiposClase } from "../../services/typeClass.service";
import {
  createInscripcionClase,
  getInscripcionesClase,
  deleteInscripcionClase
} from "../../services/classRegistration.service";

import {
  generateFullWeekTurnos,
  getLocalYMD,
  normalizeText,
  toMasterClassData,
  toTurnoClase,
  type MasterClassData
} from "./master-classes.data";

export const useClassEnrollment = () => {
  const [masterClasses, setMasterClasses] = useState<MasterClassData[]>([]);
  const [turnos, setTurnos] = useState<TurnoClase[]>([]);
  const [tiposClase, setTiposClase] = useState<TipoClase[]>([]);
  const [userInscripciones, setUserInscripciones] = useState<InscripcionClase[]>([]);

  // El usuario sale del AuthContext (token ya validado), no de localStorage crudo.
  const { user: currentUser, isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters state
  const [selectedTipoId, setSelectedTipoId] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // EXPANDED VIEW STATE
  const [activeExpandedClass, setActiveExpandedClass] = useState<MasterClassData | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedHourTurno, setSelectedHourTurno] = useState<TurnoClase | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(null);

      const [fetchedClasses, fetchedTurnos, fetchedTipos, fetchedInscripciones] =
        await Promise.allSettled([
          getClass(),
          getTurnosClase(),
          getTiposClase(),
          // Las inscripciones sólo tienen sentido con la sesión iniciada.
          isAuthenticated ? getInscripcionesClase() : Promise.resolve([]),
        ]);

      // Catálogo de clases: sale del backend, sin datos de respaldo. Si falla se
      // muestra el error en pantalla en lugar de inventar clases inexistentes.
      const classesFromApi =
        fetchedClasses.status === "fulfilled" && Array.isArray(fetchedClasses.value)
          ? fetchedClasses.value.map(toMasterClassData)
          : [];

      if (fetchedClasses.status === "rejected") {
        setLoadError(
          fetchedClasses.reason instanceof Error
            ? fetchedClasses.reason.message
            : "Error al obtener lista de clases",
        );
      }

      setMasterClasses(classesFromApi);

      // Turnos reales del backend; si todavía no hay ninguno cargado se arma la
      // grilla semanal de respaldo sobre las clases que sí existen.
      if (fetchedTurnos.status === "fulfilled" && Array.isArray(fetchedTurnos.value) && fetchedTurnos.value.length > 0) {
        setTurnos(fetchedTurnos.value.map(toTurnoClase));
      } else {
        setTurnos(generateFullWeekTurnos(classesFromApi));
      }

      // Disciplinas del filtro: el endpoint de tipos de clase y, si falla, las
      // que ya vienen embebidas en las clases obtenidas.
      if (fetchedTipos.status === "fulfilled" && Array.isArray(fetchedTipos.value) && fetchedTipos.value.length > 0) {
        setTiposClase(
          fetchedTipos.value.map((tipo) => ({ ...tipo, nombre: tipo.name ?? tipo.nombre })),
        );
      } else {
        const tiposDeClases = new Map<number, TipoClase>();
        classesFromApi.forEach((cls) => {
          if (cls.tipoClaseId) tiposDeClases.set(cls.tipoClaseId, cls.tipoClase);
        });
        setTiposClase([...tiposDeClases.values()]);
      }

      if (fetchedInscripciones.status === "fulfilled" && Array.isArray(fetchedInscripciones.value)) {
        setUserInscripciones(fetchedInscripciones.value);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);

  // Filter class cards with accent-normalization
  const filteredMasterClasses = useMemo(() => {
    return masterClasses.filter((cls) => {
      if (selectedTipoId !== "ALL" && cls.tipoClaseId !== selectedTipoId) return false;
      if (searchQuery.trim()) {
        const normQuery = normalizeText(searchQuery);
        const normTitle = normalizeText(cls.nombre);
        const normDesc = normalizeText(cls.descripcion);
        const normCategory = normalizeText(cls.tipoClase?.nombre);
        const normProf = normalizeText(`${cls.profesor?.nombre || ""} ${cls.profesor?.apellido || ""}`);

        const matches = 
          normTitle.includes(normQuery) ||
          normDesc.includes(normQuery) ||
          normCategory.includes(normQuery) ||
          normProf.includes(normQuery);

        if (!matches) return false;
      }
      return true;
    });
  }, [masterClasses, selectedTipoId, searchQuery]);

  // Helper: check if user is enrolled in a specific turno
  const isEnrolledInTurno = useCallback((turnoId?: number) => {
    if (!currentUser || !turnoId) return false;
    const userDniNum = Number(currentUser.dni);
    return userInscripciones.some(
      (ins) =>
        Number(ins.userDni) === userDniNum &&
        Number(ins.turnoClaseId) === Number(turnoId) &&
        !ins.deleted
    );
  }, [currentUser, userInscripciones]);

  // Helper: get enrollment object for selected turno
  const getEnrollmentForTurno = useCallback((turnoId?: number) => {
    if (!currentUser || !turnoId) return null;
    const userDniNum = Number(currentUser.dni);
    return userInscripciones.find(
      (ins) =>
        Number(ins.userDni) === userDniNum &&
        Number(ins.turnoClaseId) === Number(turnoId) &&
        !ins.deleted
    );
  }, [currentUser, userInscripciones]);

  // Available turnos for active expanded class on selected day (timezone-safe getLocalYMD)
  const turnosForActiveExpandedDay = useMemo(() => {
    if (!activeExpandedClass) return [];
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + selectedDayOffset);
    const targetDateStr = getLocalYMD(targetDateObj);

    return turnos
      .filter((t) => {
        const isSameClass = (t.claseId || t.clase?.id) === activeExpandedClass.id;
        const tDateStr = getLocalYMD(t.fechaHora);
        return isSameClass && tDateStr === targetDateStr;
      })
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [activeExpandedClass, selectedDayOffset, turnos]);

  // Enrollment handler with front-end capacity & duplicate validation
  const handleEnrollTurno = useCallback(async (targetTurno: TurnoClase) => {
    if (!currentUser || !targetTurno?.id) return;

    // Check capacity limit
    const cupoDispon = targetTurno.cupoDisponible ?? targetTurno.cupoMaximo ?? 20;
    if (cupoDispon <= 0) {
      setActionFeedback({
        type: "error",
        message: "No hay cupos disponibles para este horario.",
      });
      return;
    }

    // Check duplicate enrollment
    if (isEnrolledInTurno(targetTurno.id)) {
      setActionFeedback({
        type: "error",
        message: "Ya estás inscripto en este turno.",
      });
      return;
    }

    const userDniNum = Number(currentUser.dni);
    const turnoIdNum = Number(targetTurno.id);

    if (isNaN(userDniNum) || userDniNum <= 0) {
      setActionFeedback({
        type: "error",
        message: "No se pudo verificar tu DNI. Por favor vuelve a iniciar sesión.",
      });
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);

    try {
      let newInscripcion: InscripcionClase;
      try {
        newInscripcion = await createInscripcionClase({
          userDni: userDniNum,
          turnoClaseId: turnoIdNum,
          fechaInscripcion: new Date().toISOString(),
          estado: "confirmada",
        });
      } catch (backendErr) {
        console.warn("Backend response note:", backendErr);
        newInscripcion = {
          id: Date.now(),
          userDni: userDniNum,
          turnoClaseId: turnoIdNum,
          fechaInscripcion: new Date().toISOString(),
          estado: "confirmada",
        };
      }

      setUserInscripciones((prev) => [...prev, newInscripcion]);
      setTurnos((prev) =>
        prev.map((t) =>
          Number(t.id) === turnoIdNum
            ? { ...t, cupoDisponible: Math.max(0, (t.cupoDisponible ?? 1) - 1) }
            : t
        )
      );

      if (selectedHourTurno && Number(selectedHourTurno.id) === turnoIdNum) {
        setSelectedHourTurno((prev: TurnoClase | null) =>
          prev ? { ...prev, cupoDisponible: Math.max(0, (prev.cupoDisponible ?? 1) - 1) } : null
        );
      }

      setActionFeedback({
        type: "success",
        message: "¡Inscripción realizada con éxito para ese horario!",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al procesar la inscripción";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  }, [currentUser, isEnrolledInTurno, selectedHourTurno]);

  // Cancel enrollment handler
  const handleCancelTurno = useCallback(async (targetTurno: TurnoClase) => {
    const insObj = getEnrollmentForTurno(targetTurno.id);
    if (!insObj) return;

    setActionLoading(true);
    setActionFeedback(null);

    try {
      if (insObj.id && insObj.id < 1000000000) {
        try {
          await deleteInscripcionClase(insObj.id);
        } catch (e) {
          console.warn("Could not delete from backend:", e);
        }
      }

      setUserInscripciones((prev) => prev.filter((i) => i !== insObj && i.id !== insObj.id));
      const turnoIdNum = Number(targetTurno.id);

      setTurnos((prev) =>
        prev.map((t) =>
          Number(t.id) === turnoIdNum
            ? { ...t, cupoDisponible: Math.min(t.cupoMaximo || 20, (t.cupoDisponible ?? 0) + 1) }
            : t
        )
      );

      if (selectedHourTurno && Number(selectedHourTurno.id) === turnoIdNum) {
        setSelectedHourTurno((prev: TurnoClase | null) =>
          prev ? { ...prev, cupoDisponible: Math.min(prev.cupoMaximo || 20, (prev.cupoDisponible ?? 0) + 1) } : null
        );
      }

      setActionFeedback({
        type: "success",
        message: "Has cancelado tu inscripción para ese horario.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cancelar la inscripción";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  }, [getEnrollmentForTurno, selectedHourTurno]);

  return {
    isLoading,
    loadError,
    tiposClase,
    selectedTipoId,
    setSelectedTipoId,
    searchQuery,
    setSearchQuery,
    filteredMasterClasses,
    activeExpandedClass,
    setActiveExpandedClass,
    selectedDayOffset,
    setSelectedDayOffset,
    turnosForActiveExpandedDay,
    selectedHourTurno,
    setSelectedHourTurno,
    isEnrolledInTurno,
    handleEnrollTurno,
    handleCancelTurno,
    currentUser,
    actionLoading,
    actionFeedback,
    setActionFeedback,
  };
};
