import { api } from "./client";
import type { LoginResponse, Usuario } from "../types/api";

export async function login(usuario: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append("username", usuario);
  body.append("password", password);
  const { data } = await api.post<LoginResponse>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function me(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/me");
  return data;
}
