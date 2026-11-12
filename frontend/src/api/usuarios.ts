import { api } from "./client";
import type { Usuario, UsuarioCreateInput, UsuarioUpdateInput } from "../types/api";

export const listUsuarios = async () =>
  (await api.get<Usuario[]>("/usuarios", { params: { limit: 500 } })).data;

export const createUsuario = async (b: UsuarioCreateInput) =>
  (await api.post<Usuario>("/usuarios", b)).data;

export const updateUsuario = async (id: number, b: UsuarioUpdateInput) =>
  (await api.put<Usuario>(`/usuarios/${id}`, b)).data;
