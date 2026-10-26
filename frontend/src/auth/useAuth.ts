import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function homeFor(rol: "ADMIN" | "CHOFER") {
  return rol === "ADMIN" ? "/admin" : "/mis-viajes";
}
