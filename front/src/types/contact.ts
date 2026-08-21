export interface Contact {
  id: number;
  name: string;
  surname: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface CreateContactPayload {
  name: string;
  surname: string;
  email: string;
  message: string;
}
