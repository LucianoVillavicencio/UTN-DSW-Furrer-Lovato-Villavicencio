import {
  Dumbbell,
  Flame,
  Bike,
  Zap,
  Heart,
  Wind,
  Sparkles,
} from 'lucide-react';
import type { Class } from '../../types/class';
import type { TypeClass } from '../../types/typeClass';

// A class as the cards and the modal consume it. The real data comes from the
// backend (GET /api/v1/class) and is adapted here by toMasterClassData; the
// schedule fields are presentation text, because the Class entity does not
// store them.
export interface MasterClassData {
  id: number;
  name: string;
  description: string;
  scheduleDays: string;
  scheduleExplanation: string;
  typeClassId: number;
  typeClass: TypeClass;
  trainerDni: number;
  trainer: {
    dni: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
  };
}

// Opening days and hours of the gym; it is closed on Sundays.
export const CLASS_DAYS_LABEL = 'Lunes a Sábado';
const OPENING_HOUR = 7;
const CLOSING_HOUR = 22;

// Timezone-safe YYYY-MM-DD: the local date parts, never the UTC ones.
export const getLocalYMD = (d: Date | string): string => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Lowercases and strips accents so the search matches "Aerobico" against
// "Aeróbico".
export const normalizeText = (text?: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '');
};

export const renderCategoryIcon = (typeName?: string, className?: string) => {
  const lower = (typeName || '').toLowerCase();
  if (lower.includes('fuerza') || lower.includes('musculo'))
    return <Dumbbell className={className} />;
  if (lower.includes('hiit') || lower.includes('quema'))
    return <Flame className={className} />;
  if (lower.includes('spin') || lower.includes('bici'))
    return <Bike className={className} />;
  if (lower.includes('funcional') || lower.includes('zap'))
    return <Zap className={className} />;
  if (lower.includes('yoga') || lower.includes('flex'))
    return <Heart className={className} />;
  if (lower.includes('pilates') || lower.includes('core'))
    return <Wind className={className} />;
  return <Sparkles className={className} />;
};

// Schedule blurb built from the real class data.
const buildScheduleExplanation = (cls: Class): string => {
  const trainerName = cls.trainer
    ? `${cls.trainer.name} ${cls.trainer.surname}`
    : 'nuestro equipo de profesores';

  return `La clase de ${cls.name} se dicta de ${CLASS_DAYS_LABEL} de ${String(OPENING_HOUR).padStart(2, '0')}:00 a ${CLOSING_HOUR}:00 hs a cargo del Prof. ${trainerName}. Cada sesión dura 1 hora exacta (el último turno posible inicia a las ${CLOSING_HOUR - 1}:00 hs ya que el gimnasio cierra a las ${CLOSING_HOUR}:00 hs).`;
};

// Adapts the backend Class entity to the view model.
export const toMasterClassData = (cls: Class): MasterClassData => ({
  id: cls.id ?? 0,
  name: cls.name,
  description: cls.description ?? '',
  scheduleDays: CLASS_DAYS_LABEL,
  scheduleExplanation: buildScheduleExplanation(cls),
  typeClassId: cls.typeClassId,
  typeClass: {
    id: cls.typeClass?.id ?? cls.typeClassId,
    name: cls.typeClass?.name,
    description: cls.typeClass?.description,
  },
  trainerDni: cls.trainerDni,
  trainer: {
    dni: cls.trainer?.dni ?? cls.trainerDni,
    name: cls.trainer?.name ?? '',
    surname: cls.trainer?.surname ?? '',
    email: cls.trainer?.email ?? '',
    phone: cls.trainer?.phone ?? undefined,
  },
});
