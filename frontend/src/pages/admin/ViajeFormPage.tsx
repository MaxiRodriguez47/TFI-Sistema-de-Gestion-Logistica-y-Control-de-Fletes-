import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getViaje } from "../../api/viajes";
import ViajeForm from "../../components/ViajeForm";
import { parseError } from "../../utils/errors";

export default function ViajeFormPage() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const { data, isLoading, error } = useQuery({
    queryKey: ["viaje", id],
    queryFn: () => getViaje(id as string),
    enabled: esEdicion,
  });

  if (esEdicion && isLoading) return <p className="text-slate-600">Cargando…</p>;
  if (esEdicion && error) {
    const err = parseError(error);
    return (
      <div>
        <p className="text-red-700">{err.status === 404 ? "Viaje no encontrado" : err.message}</p>
        <Link to="/admin/viajes" className="mt-3 inline-block min-h-11 text-emerald-700">
          Volver a viajes
        </Link>
      </div>
    );
  }

  return (
    <ViajeForm
      viaje={esEdicion ? data : undefined}
      modo="admin"
      volverA="/admin/viajes"
      permitirEliminar
    />
  );
}
