import api from './api';
import type { Contact, CreateContactPayload } from '../types/contact';
import { getApiErrorMessage } from './api-error';

export const createContact = async (
  contact: CreateContactPayload,
): Promise<Contact> => {
  try {
    const { data } = await api.post<Contact>('/contact', contact);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al enviar el mensaje de contacto'),
      { cause: error },
    );
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const { data } = await api.get<Contact[]>('/contact');
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener la lista de contactos'),
      { cause: error },
    );
  }
};

export const getContactById = async (id: number): Promise<Contact> => {
  try {
    const { data } = await api.get<Contact>(`/contact/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Error al obtener el contacto ${id}`),
      {
        cause: error,
      },
    );
  }
};
