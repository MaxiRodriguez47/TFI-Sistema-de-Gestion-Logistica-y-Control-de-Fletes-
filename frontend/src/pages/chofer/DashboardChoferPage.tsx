import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listAllMisViajes } from "../../api/viajes";
import { useAuth } from "../../auth/useAuth";
import { Distribucion, Kpi } from "../../components/DashboardWidgets";
import { agruparViajes } from "../../utils/dashboard";
import { parseError } from "../../utils/errors";
import { dash, formatKg, formatMoney, formatNumber } from "../../utils/format";

const accesos = [
  ["/mis-viajes", "Mis viajes"],
  ["/mis-viajes/nuevo", "Nuevo viaje"],
  ["/perfil", "Mi perfil"],
] as const;

export default function DashboardChoferPage() {
  const { user } = useAuth();
  const { data: viajes, isLoading, error } = useQuery({
    queryKey: ["mis-viajes", "todos"],
    queryFn: listAllMisViajes,
  });

  const resumen = useMemo(() => {
    const lista = viajes ?? [];
    const totalNeto = lista.reduce((acc, v) => acc + v.peso_neto_kg, 0);
    const totalFlete = lista.reduce((acc, v) => acc + v.flete, 0);
    return {
      totalViajes: lista.length,
      totalNeto,
      totalFlete,
      porIngenio: agruparViajes(lista, (v) => v.ingenio.ingenio_nombre),
      porFinca: agruparViajes(lista, (v) => v.finca.finca_nombre),
      porCamion: agruparViajes(lista, (v) => v.camion.camion_patente),
    };
  }, [viajes]);

  const nombre = user?.chofer_nombre ?? user?.usuario_nombre ?? "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Mi dashboard</h1>
          <p className="text-sm text-slate-600">
            {nombre ? `Hola, ${nombre}. ` : ""}Este es el resumen de tus viajes registrados.
          </p>
        </div>
        <Link
          to="/mis-viajes/nuevo"
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo viaje
        </Link>
      </div>

      {isLoading && <p className="text-slate-600">Cargando…</p>}
      {error && <p className="text-red-700">{parseError(error).message}</p>}

      {viajes && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi etiqueta="Viajes" valor={formatNumber(resumen.totalViajes)} />
            <Kpi etiqueta="Kg netos transportados" valor={formatKg(resumen.totalNeto)} />
            <Kpi etiqueta="Fletes" valor={formatMoney(resumen.totalFlete)} />
            <Kpi
              etiqueta="Promedio por viaje"
              valor={resumen.totalViajes > 0 ? formatKg(resumen.totalNeto / resumen.totalViajes) : dash}
            />
          </div>

          {resumen.totalViajes === 0 && (
            <div className="mt-4 rounded-lg bg-white p-6 text-center shadow">
              <p className="text-slate-600">Todavía no registraste viajes.</p>
              <Link
                to="/mis-viajes/nuevo"
                className="mt-3 inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-white"
              >
                Registrar mi primer viaje
              </Link>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Distribucion titulo="Kg netos y fletes por ingenio" grupos={resumen.porIngenio} />
            <Distribucion titulo="Kg netos y fletes por finca" grupos={resumen.porFinca} />
          </div>

          {resumen.porCamion.length > 0 && (
            <section className="mt-4 rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 text-base font-semibold">Tus camiones</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3">Camión</th>
                      <th className="p-3 text-right">Viajes</th>
                      <th className="p-3 text-right">Kg netos</th>
                      <th className="p-3 text-right">Flete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.porCamion.map((c) => (
                      <tr key={c.nombre} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{c.nombre}</td>
                        <td className="p-3 text-right">{c.viajes}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatKg(c.neto)}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatMoney(c.flete)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-4">
        <h2 className="mb-2 text-base font-semibold">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {accesos.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
