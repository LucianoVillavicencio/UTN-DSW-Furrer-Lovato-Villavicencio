// A session is a class on a specific day and hour, so the form edits the date
// and the time separately and the section joins them back into a dateTime.
// Kept out of the .tsx so that file exports nothing but its component, which is
// what Fast Refresh needs.
export interface ClassSessionFormState {
  id?: number;
  classId: number;
  date: string;
  time: string;
  maxCapacity: string;
}

export const emptyClassSessionForm: ClassSessionFormState = {
  classId: 0,
  date: '',
  time: '',
  maxCapacity: '20',
};
