import { 
  Dumbbell, 
  Flame, 
  Bike, 
  Zap, 
  Heart, 
  Wind, 
  Sparkles 
} from "lucide-react";
import type { TurnoClase } from "../../types/classSession";
import type { TipoClase } from "../../types/typeClass";

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
    .replace(/[\u0300-\u036f]/g, "");
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



// Master definitions of classes with schedule days description
export const MASTER_CLASSES: MasterClassData[] = [
  {
    id: 1,
    nombre: "Entrenamiento de Fuerza Elite",
    descripcion: "Desarrolla masa muscular, potencia y fuerza bruta con musculación libre y guiada por nuestros profesionales.",
    diasClase: "Lunes a Viernes",
    explicacionDias: "Esta clase de Fuerza Elite se dicta de Lunes a Viernes de 07:00 a 22:00 hs. Cada sesión dura 1 hora exacta (el último turno posible inicia a las 21:00 hs ya que el gimnasio cierra a las 22:00 hs).",
    tipoClaseId: 1,
    tipoClase: { id: 1, nombre: "Fuerza", descripcion: "Entrenamiento de pesas y musculación" },
    profesorDni: 12345678,
    profesor: { dni: 12345678, nombre: "Marcos", apellido: "Gómez", email: "marcos@fit.com", telefono: "123456" }
  },
  {
    id: 2,
    nombre: "HIIT Full Burn",
    descripcion: "Circuitos metabólicos por intervalos de alta intensidad para máxima quema calórica y resistencia cardiovascular.",
    diasClase: "Lunes a Sábado",
    explicacionDias: "Las clases de HIIT Full Burn están programadas de Lunes a Sábado. Ofrecemos turnos matutinos, por la tarde y nocturnos entre las 07:00 y las 21:00 hs.",
    tipoClaseId: 2,
    tipoClase: { id: 2, nombre: "HIIT", descripcion: "Alta intensidad por intervalos" },
    profesorDni: 87654321,
    profesor: { dni: 87654321, nombre: "Sofía", apellido: "Valenzuela", email: "sofia@fit.com", telefono: "654321" }
  },
  {
    id: 3,
    nombre: "Spinning Revolution",
    descripcion: "Ciclismo indoor de alta energía al ritmo de las mejores listas de reproducción y playlists motivadoras.",
    diasClase: "Lunes a Sábado",
    explicacionDias: "Spinning Revolution cuenta con bicicletas fijas de última generación. Las clases se dictan de Lunes a Sábado con turnos continuos de 1 hora.",
    tipoClaseId: 3,
    tipoClase: { id: 3, nombre: "Spinning", descripcion: "Ciclismo indoor" },
    profesorDni: 12345678,
    profesor: { dni: 12345678, nombre: "Marcos", apellido: "Gómez", email: "marcos@fit.com", telefono: "123456" }
  },
  {
    id: 4,
    nombre: "Yoga Flow & Balance",
    descripcion: "Mejora tu flexibilidad, reduce el estrés diario y fortalece tu postura corporal mediante asanas y respiración.",
    diasClase: "Lunes a Viernes",
    explicacionDias: "Nuestras clases de Yoga Flow se realizan de Lunes a Viernes en ambiente climatizado y guiado. Selecciona tu horario preferido para reservar tu mat.",
    tipoClaseId: 4,
    tipoClase: { id: 4, nombre: "Yoga", descripcion: "Flexibilidad y paz mental" },
    profesorDni: 87654321,
    profesor: { dni: 87654321, nombre: "Sofía", apellido: "Valenzuela", email: "sofia@fit.com", telefono: "654321" }
  },
  {
    id: 5,
    nombre: "Pilates Reformer & Core",
    descripcion: "Ejercicios de tonificación muscular profunda, control corporal y alineación de la columna y zona media.",
    diasClase: "Lunes a Viernes",
    explicacionDias: "Pilates Reformer se imparte de Lunes a Viernes. Cada clase cuenta con cupos reducidos para asegurar una atención personalizada.",
    tipoClaseId: 5,
    tipoClase: { id: 5, nombre: "Pilates", descripcion: "Control corporal y core" },
    profesorDni: 12345678,
    profesor: { dni: 12345678, nombre: "Marcos", apellido: "Gómez", email: "marcos@fit.com", telefono: "123456" }
  }
];

// Generator for hourly class schedules across the week (from 07:00 to 21:00 hs - gym closes at 22:00 hs)
export const generateFullWeekTurnos = (): TurnoClase[] => {
  const turnosList: TurnoClase[] = [];
  let idCounter = 1000;
  const hourlySlots = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + dayOffset);

    if (baseDate.getDay() === 0) continue; // Gym closed on Sunday

    hourlySlots.forEach((hour) => {
      MASTER_CLASSES.forEach((clsDef, cIndex) => {
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
