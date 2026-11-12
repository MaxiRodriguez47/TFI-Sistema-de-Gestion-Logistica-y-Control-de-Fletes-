import { api } from "./client";
import type { Ingenio, IngenioInput } from "../types/api";

export const listIngenios = async () =>
  (await api.get<Ingenio[]>("/ingenios", { params: { limit: 500 } })).data;

export const createIngenio = async (b: IngenioInput) =>
  (await api.post<Ingenio>("/ingenios", b)).data;

export const updateIngenio = async (id: number, b: IngenioInput) =>
  (await api.put<Ingenio>(`/ingenios/${id}`, b)).data;

export const deleteIngenio = async (id: number) => {
  await api.delete(`/ingenios/${id}`);
};
