import { Navigate, Outlet } from "react-router-dom";
import { homeFor, useAuth } from "./useAuth";
import type { Rol } from "../types/api";

export default function ProtectedRoute({ rol }: { rol?: Rol }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-slate-600">Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (rol && user.rol !== rol) return <Navigate to={homeFor(user.rol)} replace />;
  return <Outlet />;
}
