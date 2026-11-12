import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getViaje } from "../../api/viajes";
import ViajeForm from "../../components/ViajeForm";
import { useAuth } from "../../auth/useAuth";
import { parseError } from "../../utils/errors";

export default function ChoferViajeFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const esEdicion = Boolean(id);
  const { data, isLoading, error } = useQuery({
    queryKey: ["viaje", id],
    queryFn: () => getViaje(id as string),
    enabled: esEdicion,
  });

  if (!user?.chofer_dni) {
    return (
      <p className="text-red-700">
        Tu usuario no tiene un chofer vinculado. Contactá a un administrador.
      </p>
    );
  }

  if (esEdicion && isLoading) return <p className="text-slate-600">Cargando…</p>;
  if (esEdicion && error) {
    const err = parseError(error);
    return (
      <div>
        <p className="text-red-700">{err.status === 404 ? "Viaje no encontrado" : err.message}</p>
        <Link to="/mis-viajes" className="mt-3 inline-block min-h-11 text-emerald-700">
          Volver a mis viajes
        </Link>
      </div>
    );
  }

  return (
    <ViajeForm
      viaje={esEdicion ? data : undefined}
      modo="chofer"
      choferFijo={{ dni: user.chofer_dni, nombre: user.chofer_nombre ?? user.usuario_nombre }}
      volverA="/mis-viajes"
    />
  );
}
