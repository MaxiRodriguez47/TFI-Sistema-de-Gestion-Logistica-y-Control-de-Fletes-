import { api } from "./client";
import type { Productor, ProductorInput } from "../types/api";

export const listProductos = async () =>
  (await api.get<Productor[]>("/productos", { params: { limit: 500 } })).data;

export const createProducto = async (b: ProductorInput) =>
  (await api.post<Productor>("/productos", b)).data;

export const updateProducto = async (cuit: string, b: ProductorInput) =>
  (await api.put<Productor>(`/productos/${encodeURIComponent(cuit)}`, b)).data;

export const deleteProducto = async (cuit: string) => {
  await api.delete(`/productos/${encodeURIComponent(cuit)}`);
};
