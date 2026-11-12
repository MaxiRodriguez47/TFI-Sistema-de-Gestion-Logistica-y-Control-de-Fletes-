import { api } from "./client";
import type { Finca, FincaInput } from "../types/api";

export const listFincas = async () =>
  (await api.get<Finca[]>("/fincas", { params: { limit: 500 } })).data;

export const createFinca = async (b: FincaInput) =>
  (await api.post<Finca>("/fincas", b)).data;

export const updateFinca = async (id: number, b: FincaInput) =>
  (await api.put<Finca>(`/fincas/${id}`, b)).data;

export const deleteFinca = async (id: number) => {
  await api.delete(`/fincas/${id}`);
};

export const asociarProductor = async (idFinca: number, cuit: string) =>
  (
    await api.post<Finca>(
      `/fincas/${idFinca}/productores/${encodeURIComponent(cuit)}`,
    )
  ).data;

export const desasociarProductor = async (idFinca: number, cuit: string) =>
  (
    await api.delete<Finca>(
      `/fincas/${idFinca}/productores/${encodeURIComponent(cuit)}`,
    )
  ).data;
