import { api } from "./client";
import type { Chofer, ChoferInput } from "../types/api";

export const listChoferes = async () =>
  (await api.get<Chofer[]>("/choferes", { params: { limit: 500 } })).data;

export const createChofer = async (b: ChoferInput) =>
  (await api.post<Chofer>("/choferes", b)).data;

export const updateChofer = async (dni: string, b: ChoferInput) =>
  (await api.put<Chofer>(`/choferes/${encodeURIComponent(dni)}`, b)).data;

export const deleteChofer = async (dni: string) => {
  await api.delete(`/choferes/${encodeURIComponent(dni)}`);
};
