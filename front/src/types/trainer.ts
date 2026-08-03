export interface Trainer {
  dni: number;
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  speciality?: string | null;
  deleted?: boolean;
}
