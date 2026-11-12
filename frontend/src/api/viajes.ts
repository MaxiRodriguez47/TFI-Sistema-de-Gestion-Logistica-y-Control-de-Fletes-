import { api } from "./client";
import type { Viaje, ViajeCreateInput, ViajeInput } from "../types/api";

export interface ViajeFiltros {
  id_finca?: number;
  id_ingenio?: number;
  chofer_dni?: string;
  camion_patente?: string;
  producto_cuit?: string;
  skip?: number;
  limit?: number;
}

export const listViajes = async (filtros: ViajeFiltros = {}) =>
  (await api.get<Viaje[]>("/viajes", { params: filtros })).data;

/** Trae todos los viajes paginando de a 500 (máximo del backend). */
export const listAllViajes = async () => {
  const PAGE = 500;
  const todos: Viaje[] = [];
  for (let skip = 0; ; skip += PAGE) {
    const pagina = await listViajes({ skip, limit: PAGE });
    todos.push(...pagina);
    if (pagina.length < PAGE) break;
  }
  return todos;
};

export const listMisViajes = async (params: { skip?: number; limit?: number } = {}) =>
  (await api.get<Viaje[]>("/viajes/mis-viajes", { params })).data;

/** Trae todos los viajes propios paginando de a 500 (máximo del backend). */
export const listAllMisViajes = async () => {
  const PAGE = 500;
  const todos: Viaje[] = [];
  for (let skip = 0; ; skip += PAGE) {
    const pagina = await listMisViajes({ skip, limit: PAGE });
    todos.push(...pagina);
    if (pagina.length < PAGE) break;
  }
  return todos;
};

export const getViaje = async (id: string) =>
  (await api.get<Viaje>(`/viajes/${encodeURIComponent(id)}`)).data;

export const createViaje = async (b: ViajeCreateInput) =>
  (await api.post<Viaje>("/viajes", b)).data;

export const updateViaje = async (id: string, b: ViajeInput) =>
  (await api.put<Viaje>(`/viajes/${encodeURIComponent(id)}`, b)).data;

export const deleteViaje = async (id: string) => {
  await api.delete(`/viajes/${encodeURIComponent(id)}`);
};
