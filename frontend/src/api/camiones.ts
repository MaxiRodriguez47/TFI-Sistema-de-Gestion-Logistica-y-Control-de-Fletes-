import { api } from "./client";
import type { Camion, CamionInput } from "../types/api";

export const listCamiones = async () =>
  (await api.get<Camion[]>("/camiones", { params: { limit: 500 } })).data;

export const createCamion = async (b: CamionInput) =>
  (await api.post<Camion>("/camiones", b)).data;

export const updateCamion = async (patente: string, b: CamionInput) =>
  (await api.put<Camion>(`/camiones/${encodeURIComponent(patente)}`, b)).data;

export const deleteCamion = async (patente: string) => {
  await api.delete(`/camiones/${encodeURIComponent(patente)}`);
};
