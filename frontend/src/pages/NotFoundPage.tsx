import { Link } from "react-router-dom";
import { homeFor, useAuth } from "../auth/useAuth";

export default function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="p-8 text-center">
      <h1 className="mb-2 text-2xl font-bold">Página no encontrada</h1>
      <Link className="text-emerald-700 underline" to={user ? homeFor(user.rol) : "/login"}>
        Ir al inicio
      </Link>
    </div>
  );
}
