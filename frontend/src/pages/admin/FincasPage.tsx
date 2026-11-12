import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  asociarProductor,
  createFinca,
  deleteFinca,
  desasociarProductor,
  listFincas,
  updateFinca,
} from "../../api/fincas";
import { listLocalidades } from "../../api/localidades";
import { listProductos } from "../../api/productos";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { parseError } from "../../utils/errors";
import { dash } from "../../utils/format";
import type { Finca } from "../../types/api";

const FINCAS_KEY = ["fincas"];
const LOCALIDADES_KEY = ["localidades"];
const PRODUCTORES_KEY = ["productos"];

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

export default function FincasPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: FINCAS_KEY, queryFn: listFincas });
  const { data: localidades } = useQuery({ queryKey: LOCALIDADES_KEY, queryFn: listLocalidades });
  const { data: productos } = useQuery({ queryKey: PRODUCTORES_KEY, queryFn: listProductos });

  const [editing, setEditing] = useState<Finca | "new" | null>(null);
  const [nombre, setNombre] = useState("");
  const [idLocalidad, setIdLocalidad] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Finca | null>(null);
  const [managing, setManaging] = useState<Finca | null>(null);
  const [selectedCuit, setSelectedCuit] = useState("");
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm(f: Finca | "new") {
    setEditing(f);
    setNombre(f === "new" ? "" : f.finca_nombre);
    setIdLocalidad(f === "new" ? "" : String(f.id_localidad));
    setFormError("");
    setFieldErrors({});
  }

  function showNotice(type: "ok" | "error", text: string) {
    setNotice({ type, text });
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { finca_nombre: nombre.trim(), id_localidad: Number(idLocalidad) };
      return editing === "new"
        ? createFinca(body)
        : updateFinca((editing as Finca).id_finca, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      qc.invalidateQueries({ queryKey: LOCALIDADES_KEY });
      showNotice("ok", "Finca guardada");
      setEditing(null);
    },
    onError: (e) => {
      const err = parseError(e);
      setFormError(err.message);
      setFieldErrors(err.fieldErrors);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteFinca(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      qc.invalidateQueries({ queryKey: LOCALIDADES_KEY });
      showNotice("ok", "Finca eliminada");
      setToDelete(null);
    },
    onError: (e) => {
      const err = parseError(e);
      showNotice(
        "error",
        err.status === 409 ? `No se puede eliminar: ${err.message}` : err.message,
      );
      setToDelete(null);
    },
  });

  const asociar = useMutation({
    mutationFn: ({ id, cuit }: { id: number; cuit: string }) => asociarProductor(id, cuit),
    onSuccess: (finca) => {
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      setManaging(finca);
      setSelectedCuit("");
      setModalError("");
    },
    onError: (e) => setModalError(parseError(e).message),
  });

  const desasociar = useMutation({
    mutationFn: ({ id, cuit }: { id: number; cuit: string }) => desasociarProductor(id, cuit),
    onSuccess: (finca) => {
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      setManaging(finca);
      setModalError("");
    },
    onError: (e) => setModalError(parseError(e).message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length > 100) {
      errs.finca_nombre = "El nombre es obligatorio (máx. 100 caracteres)";
    }
    if (!idLocalidad) errs.id_localidad = "Seleccioná una localidad";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("Revisá los datos ingresados");
      return;
    }
    setFormError("");
    save.mutate();
  }

  const disponibles =
    productos?.filter(
      (p) => !managing?.productores.some((asociado) => asociado.producto_cuit === p.producto_cuit),
    ) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Fincas</h1>
        <button
          onClick={() => openForm("new")}
          disabled={!!localidades && localidades.length === 0}
          className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
        >
          Nueva finca
        </button>
      </div>

      {localidades && localidades.length === 0 && (
        <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">
          Primero tenés que crear una localidad en{" "}
          <Link to="/admin/localidades" className="font-medium underline">
            Localidades
          </Link>
          .
        </p>
      )}

      {notice && (
        <p
          role="status"
          className={`mb-3 rounded p-2 text-sm ${notice.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      {isLoading && <p className="text-slate-600">Cargando…</p>}
      {error && <p className="text-red-700">{parseError(error).message}</p>}
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay fincas.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Localidad</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Productores</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id_finca} className="border-t border-slate-100">
                  <td className="p-3">{f.id_finca}</td>
                  <td className="p-3 font-medium">{f.finca_nombre}</td>
                  <td className="p-3">{f.localidad?.localidad_nombre ?? dash}</td>
                  <td className="p-3">{f.localidad?.departamento ?? dash}</td>
                  <td className="p-3">
                    {f.productores.length === 0 ? (
                      <span className="text-slate-400">{dash}</span>
                    ) : (
                      <span className="text-slate-600">
                        {f.productores.map((p) => p.producto_nombre).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="space-x-1 p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setManaging(f);
                        setSelectedCuit("");
                        setModalError("");
                      }}
                      className="min-h-11 px-2 text-slate-700"
                    >
                      Productores
                    </button>
                    <button onClick={() => openForm(f)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(f)} className="min-h-11 px-2 text-red-600">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === "new" ? "Nueva finca" : "Editar finca"}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          {formError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium">
            Nombre
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {fieldErrors.finca_nombre && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.finca_nombre}</span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Localidad
            <select
              className={inputClass}
              value={idLocalidad}
              onChange={(e) => setIdLocalidad(e.target.value)}
            >
              <option value="">Seleccioná una localidad</option>
              {localidades?.map((l) => (
                <option key={l.id_localidad} value={l.id_localidad}>
                  {l.localidad_nombre} — {l.departamento}
                </option>
              ))}
            </select>
            {fieldErrors.id_localidad && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.id_localidad}</span>
            )}
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 rounded-md border border-slate-300 px-4"
            >
              Cancelar
            </button>
            <button
              disabled={save.isPending}
              className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
            >
              {save.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!managing}
        title={`Productores — ${managing?.finca_nombre ?? ""}`}
        onClose={() => setManaging(null)}
        wide
      >
        {modalError && (
          <p role="alert" className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
            {modalError}
          </p>
        )}

        {managing?.productores.length === 0 ? (
          <p className="mb-4 text-sm text-slate-600">Esta finca no tiene productores asociados.</p>
        ) : (
          <ul className="mb-4 flex flex-wrap gap-2">
            {managing?.productores.map((p) => (
              <li
                key={p.producto_cuit}
                className="flex items-center gap-1 rounded-full bg-emerald-50 py-1 pl-3 pr-1 text-sm text-emerald-900"
              >
                <span>
                  {p.producto_nombre} <span className="text-emerald-700">({p.producto_cuit})</span>
                </span>
                <button
                  type="button"
                  aria-label={`Quitar ${p.producto_nombre}`}
                  disabled={desasociar.isPending}
                  onClick={() =>
                    managing && desasociar.mutate({ id: managing.id_finca, cuit: p.producto_cuit })
                  }
                  className="min-h-8 min-w-8 rounded-full hover:bg-emerald-100 disabled:opacity-60"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {disponibles.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="block min-w-40 flex-1 text-sm font-medium">
              Agregar productor
              <select
                className={inputClass}
                value={selectedCuit}
                onChange={(e) => setSelectedCuit(e.target.value)}
              >
                <option value="">Seleccioná un productor</option>
                {disponibles.map((p) => (
                  <option key={p.producto_cuit} value={p.producto_cuit}>
                    {p.producto_nombre} — {p.producto_cuit}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedCuit || asociar.isPending || !managing}
              onClick={() =>
                managing && asociar.mutate({ id: managing.id_finca, cuit: selectedCuit })
              }
              className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
            >
              {asociar.isPending ? "Agregando…" : "Agregar"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No hay productores disponibles para agregar.{" "}
            <Link to="/admin/productores" className="font-medium underline">
              Crear productor
            </Link>
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setManaging(null)}
            className="min-h-11 rounded-md border border-slate-300 px-4"
          >
            Listo
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar finca"
        message={`¿Eliminar "${toDelete?.finca_nombre}"? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id_finca)}
      />
    </div>
  );
}
