// A turno is a weekly slot, so the form edits weekdays and hours, never a date.
// Creating takes several of each at once — "Funcional on Mon/Wed/Fri at 8, 14
// and 19" is one save — while editing moves a single existing slot, so both
// lists hold exactly one value then.
// Kept out of the .tsx so that file exports nothing but its component, which is
// what Fast Refresh needs.
export interface ClassSessionFormState {
  id?: number;
  classId: number;
  weekdays: number[];
  // 'HH:MM', as <input type="time"> speaks it.
  times: string[];
  maxCapacity: string;
}

export const emptyClassSessionForm: ClassSessionFormState = {
  classId: 0,
  weekdays: [],
  times: [''],
  maxCapacity: '20',
};
