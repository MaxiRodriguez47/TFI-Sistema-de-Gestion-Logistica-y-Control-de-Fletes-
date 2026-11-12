import { api } from "./client";
import type { Localidad, LocalidadInput } from "../types/api";

export const listLocalidades = async () =>
  (await api.get<Localidad[]>("/localidades", { params: { limit: 500 } })).data;
export const createLocalidad = async (b: LocalidadInput) =>
  (await api.post<Localidad>("/localidades", b)).data;
export const updateLocalidad = async (id: number, b: LocalidadInput) =>
  (await api.put<Localidad>(`/localidades/${id}`, b)).data;
export const deleteLocalidad = async (id: number) => {
  await api.delete(`/localidades/${id}`);
};
