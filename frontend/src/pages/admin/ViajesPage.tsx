import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteViaje, listViajes, type ViajeFiltros } from "../../api/viajes";
import { listFincas } from "../../api/fincas";
import { listIngenios } from "../../api/ingenios";
import { listChoferes } from "../../api/choferes";
import { listCamiones } from "../../api/camiones";
import { listProductos } from "../../api/productos";
import ConfirmDialog from "../../components/ConfirmDialog";
import { parseError } from "../../utils/errors";
import { formatKg, formatMoney } from "../../utils/format";
import type { Viaje } from "../../types/api";

const PAGE_SIZE = 10;
const VIAJES_KEY = ["viajes"];
const CATALOGOS_KEY = ["catalogos"];

interface FiltrosState {
  finca: string;
  ingenio: string;
  chofer: string;
  camion: string;
  producto: string;
}

const filtrosVacios: FiltrosState = { finca: "", ingenio: "", chofer: "", camion: "", producto: "" };

const selectClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";

export default function ViajesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosState>(filtrosVacios);
  const [toDelete, setToDelete] = useState<Viaje | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice({ type: "ok", text: state.notice });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const filtrosApi: ViajeFiltros = {
    id_finca: filtros.finca ? Number(filtros.finca) : undefined,
    id_ingenio: filtros.ingenio ? Number(filtros.ingenio) : undefined,
    chofer_dni: filtros.chofer || undefined,
    camion_patente: filtros.camion || undefined,
    producto_cuit: filtros.producto || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [...VIAJES_KEY, page, filtrosApi],
    queryFn: async () => {
      const filas = await listViajes({ ...filtrosApi, skip: page * PAGE_SIZE, limit: PAGE_SIZE + 1 });
      return { items: filas.slice(0, PAGE_SIZE), hasNext: filas.length > PAGE_SIZE };
    },
  });

  const { data: fincas } = useQuery({ queryKey: [...CATALOGOS_KEY, "fincas"], queryFn: listFincas });
  const { data: ingenios } = useQuery({ queryKey: [...CATALOGOS_KEY, "ingenios"], queryFn: listIngenios });
  const { data: choferes } = useQuery({ queryKey: [...CATALOGOS_KEY, "choferes"], queryFn: listChoferes });
  const { data: camiones } = useQuery({ queryKey: [...CATALOGOS_KEY, "camiones"], queryFn: listCamiones });
  const { data: productos } = useQuery({ queryKey: [...CATALOGOS_KEY, "productos"], queryFn: listProductos });

  const remove = useMutation({
    mutationFn: (id: string) => deleteViaje(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: VIAJES_KEY });
      setNotice({ type: "ok", text: `Viaje ${id} eliminado` });
      setToDelete(null);
      if (data?.items.length === 1 && page > 0) setPage((p) => p - 1);
    },
    onError: (e) => {
      const err = parseError(e);
      setNotice({
        type: "error",
        text: err.status === 409 ? `No se puede eliminar: ${err.message}` : err.message,
      });
      setToDelete(null);
    },
  });

  function setFiltro(campo: keyof FiltrosState, valor: string) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPage(0);
  }

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Viajes</h1>
        <Link
          to="/admin/viajes/nuevo"
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo viaje
        </Link>
      </div>

      {notice && (
        <p
          role="status"
          className={`mb-3 rounded p-2 text-sm ${notice.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      <div className="mb-4 rounded-lg bg-white p-3 shadow">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs font-medium text-slate-700">
            Finca
            <select className={selectClass} value={filtros.finca} onChange={(e) => setFiltro("finca", e.target.value)}>
              <option value="">Todas</option>
              {fincas?.map((f) => (
                <option key={f.id_finca} value={f.id_finca}>
                  {f.finca_nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Ingenio
            <select className={selectClass} value={filtros.ingenio} onChange={(e) => setFiltro("ingenio", e.target.value)}>
              <option value="">Todos</option>
              {ingenios?.map((i) => (
                <option key={i.id_ingenio} value={i.id_ingenio}>
                  {i.ingenio_nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Chofer
            <select className={selectClass} value={filtros.chofer} onChange={(e) => setFiltro("chofer", e.target.value)}>
              <option value="">Todos</option>
              {choferes?.map((c) => (
                <option key={c.chofer_dni} value={c.chofer_dni}>
                  {c.chofer_nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Camión
            <select className={selectClass} value={filtros.camion} onChange={(e) => setFiltro("camion", e.target.value)}>
              <option value="">Todos</option>
              {camiones?.map((c) => (
                <option key={c.camion_patente} value={c.camion_patente}>
                  {c.camion_patente}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Productor
            <select className={selectClass} value={filtros.producto} onChange={(e) => setFiltro("producto", e.target.value)}>
              <option value="">Todos</option>
              {productos?.map((p) => (
                <option key={p.producto_cuit} value={p.producto_cuit}>
                  {p.producto_nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setFiltros(filtrosVacios);
              setPage(0);
            }}
            className="mt-3 min-h-11 rounded-md border border-slate-300 px-3 text-sm"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="text-slate-600">Cargando…</p>}
      {error && <p className="text-red-700">{parseError(error).message}</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <p className="text-slate-600">
            {hayFiltros ? "No hay viajes que coincidan con los filtros." : "Todavía no hay viajes registrados."}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">N° vale</th>
                  <th className="p-3">Finca</th>
                  <th className="p-3">Productor</th>
                  <th className="p-3">Ingenio</th>
                  <th className="p-3">Camión</th>
                  <th className="p-3">Chofer</th>
                  <th className="p-3 text-right">Peso bruto</th>
                  <th className="p-3 text-right">Tara</th>
                  <th className="p-3 text-right">Peso neto</th>
                  <th className="p-3 text-right">Tarifa</th>
                  <th className="p-3 text-right">Flete</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((v) => (
                  <tr key={v.id_viaje} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{v.id_viaje}</td>
                    <td className="p-3">{v.num_vale}</td>
                    <td className="p-3">{v.finca.finca_nombre}</td>
                    <td className="p-3">{v.producto.producto_nombre}</td>
                    <td className="p-3">{v.ingenio.ingenio_nombre}</td>
                    <td className="p-3">{v.camion.camion_patente}</td>
                    <td className="p-3">{v.chofer.chofer_nombre}</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatKg(v.peso_bruto_kg)}</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatKg(v.tara_kg)}</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatKg(v.peso_neto_kg)}</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatMoney(v.tarifa_ton)}</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatMoney(v.flete)}</td>
                    <td className="space-x-1 p-3 text-right whitespace-nowrap">
                      <Link to={`/admin/viajes/${encodeURIComponent(v.id_viaje)}`} className="inline-block min-h-11 px-2 py-3 text-emerald-700">
                        Editar
                      </Link>
                      <button onClick={() => setToDelete(v)} className="min-h-11 px-2 text-red-600">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar viaje"
        message={`¿Eliminar el viaje ${toDelete?.id_viaje} (vale ${toDelete?.num_vale})? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id_viaje)}
      />
    </div>
  );
}
