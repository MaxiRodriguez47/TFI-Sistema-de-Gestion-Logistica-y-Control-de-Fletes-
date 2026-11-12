import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listMisViajes } from "../../api/viajes";
import { parseError } from "../../utils/errors";
import { formatKg, formatMoney } from "../../utils/format";

const PAGE_SIZE = 10;
const MIS_VIAJES_KEY = ["mis-viajes"];

export default function MisViajesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: [...MIS_VIAJES_KEY, page],
    queryFn: async () => {
      const filas = await listMisViajes({ skip: page * PAGE_SIZE, limit: PAGE_SIZE + 1 });
      return { items: filas.slice(0, PAGE_SIZE), hasNext: filas.length > PAGE_SIZE };
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Mis viajes</h1>
        <Link
          to="/mis-viajes/nuevo"
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo viaje
        </Link>
      </div>

      {notice && (
        <p role="status" className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {isLoading && <p className="text-slate-600">Cargando…</p>}
      {error && <p className="text-red-700">{parseError(error).message}</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <p className="mb-3 text-slate-600">Todavía no registraste viajes.</p>
          <Link
            to="/mis-viajes/nuevo"
            className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-white"
          >
            Registrar mi primer viaje
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((v) => (
              <li key={v.id_viaje} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{v.id_viaje}</p>
                    <p className="text-xs text-slate-500">Vale {v.num_vale}</p>
                  </div>
                  <Link
                    to={`/mis-viajes/${encodeURIComponent(v.id_viaje)}`}
                    className="inline-flex min-h-11 items-center px-2 text-sm text-emerald-700"
                  >
                    Editar
                  </Link>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500">Finca</dt>
                    <dd>{v.finca.finca_nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Productor</dt>
                    <dd>{v.producto.producto_nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Ingenio</dt>
                    <dd>{v.ingenio.ingenio_nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Camión</dt>
                    <dd>{v.camion.camion_patente}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Peso neto</dt>
                    <dd className="font-medium">{formatKg(v.peso_neto_kg)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Flete</dt>
                    <dd className="font-medium text-emerald-800">{formatMoney(v.flete)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-600">
              Página {page + 1} · {data.items.length} viaje{data.items.length === 1 ? "" : "s"} en esta página
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="min-h-11 rounded-md border border-slate-300 px-4 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!data.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="min-h-11 rounded-md border border-slate-300 px-4 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
