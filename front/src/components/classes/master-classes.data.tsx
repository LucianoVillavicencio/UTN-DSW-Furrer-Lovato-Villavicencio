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

// Adapts the backend Class entity to the view model. The schedule is NOT part
// of it: the days and hours come from the class's weekly turnos, and the blurb
// that used to be built here announced "Lunes a Sábado de 07:00 a 22:00" for
// every class regardless of what was actually published.
export const toMasterClassData = (cls: Class): MasterClassData => ({
  id: cls.id ?? 0,
  name: cls.name,
  description: cls.description ?? '',
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
