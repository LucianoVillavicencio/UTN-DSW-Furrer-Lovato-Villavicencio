import api from "./api";
import type { Contact, CreateContactPayload } from "../types/contact";
import { AxiosError } from "axios";

export const createContact = async (
  contact: CreateContactPayload,
): Promise<Contact> => {
  try {
    const response = await api.post<Contact>("/contact", contact);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const backendMessage = error.response?.data?.message;
      throw new Error(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Error al enviar el mensaje de contacto",
      );
    }
    throw new Error("Ocurrió un error inesperado al enviar tu consulta");
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await api.get<Contact[]>("/contact");
    return response.data;
  } catch {
    throw new Error("Error al obtener la lista de contactos");
  }
};

export const getContactById = async (id: number): Promise<Contact> => {
  try {
    const response = await api.get<Contact>(`/contact/${id}`);
    return response.data;
  } catch {
    throw new Error(`Error al obtener el contacto ${id}`);
  }
};
