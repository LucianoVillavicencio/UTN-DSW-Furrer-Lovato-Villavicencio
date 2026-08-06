export interface Plan {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  numDays: number;
  deleted?: boolean;
}
