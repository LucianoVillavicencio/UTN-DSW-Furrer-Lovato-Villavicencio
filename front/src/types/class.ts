import type { TypeClass } from './typeClass';
import type { Trainer } from './trainer';

export interface Class {
  id?: number;
  name: string;
  description?: string | null;
  typeClassId: number;
  typeClass?: TypeClass;
  trainerDni: number;
  trainer?: Trainer;
  deleted?: boolean;
}
