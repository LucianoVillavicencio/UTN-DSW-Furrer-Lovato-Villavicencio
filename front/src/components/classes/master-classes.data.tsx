import { 
  Dumbbell, 
  Flame, 
  Bike, 
  Zap, 
  Heart, 
  Wind, 
  Sparkles 
} from "lucide-react";
import type { Class } from "../../types/class";
import type { ClassSession, TurnoClase } from "../../types/classSession";
import type { TipoClase } from "../../types/typeClass";

// Vista de una clase tal como la consumen las tarjetas y el modal.
// Los datos reales vienen del backend (GET /api/v1/class) y se adaptan acá con
// toMasterClassData; los campos de agenda (diasClase / explicacionDias) son
// texto de presentación, porque la entidad Class no los almacena.
export interface MasterClassData {
  id: number;
  nombre: string;
  descripcion: string;
  diasClase: string;
  explicacionDias: string;
  tipoClaseId: number;
  tipoClase: TipoClase;
  profesorDni: number;
  profesor: {
    dni: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
}

// Días y horarios de atención del gimnasio (cerrado los domingos).
export const CLASS_DAYS_LABEL = "Lunes a Sábado";
const OPENING_HOUR = 7;
const CLOSING_HOUR = 22;

// Helper for timezone-safe YYYY-MM-DD local date formatting
export const getLocalYMD = (d: Date | string): string => {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper for accent-insensitive search normalization
export const normalizeText = (text?: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "");
};

// Helper function returning static JSX icon elements directly
export const renderCategoryIcon = (tipoNombre?: string, className?: string) => {
  const lower = (tipoNombre || "").toLowerCase();
  if (lower.includes("fuerza") || lower.includes("musculo")) return <Dumbbell className={className} />;
  if (lower.includes("hiit") || lower.includes("quema")) return <Flame className={className} />;
  if (lower.includes("spin") || lower.includes("bici")) return <Bike className={className} />;
  if (lower.includes("funcional") || lower.includes("zap")) return <Zap className={className} />;
  if (lower.includes("yoga") || lower.includes("flex")) return <Heart className={className} />;
  if (lower.includes("pilates") || lower.includes("core")) return <Wind className={className} />;
  return <Sparkles className={className} />;
};

// Texto de agenda armado con los datos reales de la clase.
const buildScheduleExplanation = (cls: Class): string => {
  const trainerName = cls.trainer
    ? `${cls.trainer.name} ${cls.trainer.surname}`
    : "nuestro equipo de profesores";

  return `La clase de ${cls.name} se dicta de ${CLASS_DAYS_LABEL} de ${String(OPENING_HOUR).padStart(2, "0")}:00 a ${CLOSING_HOUR}:00 hs a cargo del Prof. ${trainerName}. Cada sesión dura 1 hora exacta (el último turno posible inicia a las ${CLOSING_HOUR - 1}:00 hs ya que el gimnasio cierra a las ${CLOSING_HOUR}:00 hs).`;
};

// Adapta la entidad Class del backend (campos en inglés) a la vista.
export const toMasterClassData = (cls: Class): MasterClassData => ({
  id: cls.id ?? 0,
  nombre: cls.name,
  descripcion: cls.description ?? "",
  diasClase: CLASS_DAYS_LABEL,
  explicacionDias: buildScheduleExplanation(cls),
  tipoClaseId: cls.typeClassId,
  tipoClase: {
    id: cls.typeClass?.id ?? cls.typeClassId,
    nombre: cls.typeClass?.name ?? cls.typeClass?.nombre,
    descripcion: cls.typeClass?.description ?? cls.typeClass?.descripcion,
  },
  profesorDni: cls.trainerDni,
  profesor: {
    dni: cls.trainer?.dni ?? cls.trainerDni,
    nombre: cls.trainer?.name ?? "",
    apellido: cls.trainer?.surname ?? "",
    email: cls.trainer?.email ?? "",
    telefono: cls.trainer?.phone ?? undefined,
  },
});

// Adapta un turno del backend (ClassSession, campos en inglés) al shape que
// usan la grilla de horarios y el resumen de inscripción.
export const toTurnoClase = (session: ClassSession): TurnoClase => ({
  ...session,
  claseId: session.classId ?? session.claseId,
  clase: session.class ?? session.clase,
  fechaHora: session.dateTime ?? session.fechaHora,
  cupoMaximo: session.maxCapacity ?? session.cupoMaximo,
  cupoDisponible: session.availableSpots ?? session.cupoDisponible,
});

// Generador de turnos por hora para la semana, usado como respaldo cuando el
// backend todavía no tiene turnos cargados (de 07:00 a 21:00 hs).
export const generateFullWeekTurnos = (masterClasses: MasterClassData[]): TurnoClase[] => {
  const turnosList: TurnoClase[] = [];
  let idCounter = 1000;
  const hourlySlots = Array.from(
    { length: CLOSING_HOUR - OPENING_HOUR },
    (_, i) => OPENING_HOUR + i,
  );

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + dayOffset);

    if (baseDate.getDay() === 0) continue; // Gym closed on Sunday

    hourlySlots.forEach((hour) => {
      masterClasses.forEach((clsDef, cIndex) => {
        if ((hour + cIndex + dayOffset) % 2 === 0) {
          const slotDate = new Date(baseDate);
          slotDate.setHours(hour, 0, 0, 0);

          const cupoMaximo = 20;
          const seed = (dayOffset * 13 + hour * 7 + cIndex * 5) % 21;
          const cupoDisponible = seed === 0 ? 0 : Math.min(cupoMaximo, seed);

          turnosList.push({
            id: idCounter++,
            claseId: clsDef.id,
            clase: clsDef,
            fechaHora: slotDate.toISOString(),
            cupoMaximo,
            cupoDisponible,
          });
        }
      });
    });
  }

  return turnosList;
};
