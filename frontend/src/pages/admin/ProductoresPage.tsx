import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProducto,
  deleteProducto,
  listProductos,
  updateProducto,
} from "../../api/productos";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { parseError } from "../../utils/errors";
import { dash } from "../../utils/format";
import type { Productor } from "../../types/api";

const PRODUCTORES_KEY = ["productos"];
const FINCAS_KEY = ["fincas"];

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

export default function ProductoresPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: PRODUCTORES_KEY,
    queryFn: listProductos,
  });

  const [editing, setEditing] = useState<Productor | "new" | null>(null);
  const [cuit, setCuit] = useState("");
  const [nombre, setNombre] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Productor | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm(p: Productor | "new") {
    setEditing(p);
    setCuit(p === "new" ? "" : p.producto_cuit);
    setNombre(p === "new" ? "" : p.producto_nombre);
    setFormError("");
    setFieldErrors({});
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { producto_cuit: cuit.trim(), producto_nombre: nombre.trim() };
      return editing === "new"
        ? createProducto(body)
        : updateProducto((editing as Productor).producto_cuit, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTORES_KEY });
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      setNotice({ type: "ok", text: "Productor guardado" });
      setEditing(null);
    },
    onError: (e) => {
      const err = parseError(e);
      setFormError(err.message);
      setFieldErrors(err.fieldErrors);
    },
  });

  const remove = useMutation({
    mutationFn: (cuitProductor: string) => deleteProducto(cuitProductor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTORES_KEY });
      qc.invalidateQueries({ queryKey: FINCAS_KEY });
      setNotice({ type: "ok", text: "Productor eliminado" });
      setToDelete(null);
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!cuit.trim() || cuit.trim().length > 20) {
      errs.producto_cuit = "El CUIT es obligatorio (máx. 20 caracteres)";
    }
    if (!nombre.trim() || nombre.trim().length > 100) {
      errs.producto_nombre = "El nombre es obligatorio (máx. 100 caracteres)";
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("Revisá los datos ingresados");
      return;
    }
    setFormError("");
    save.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Productores</h1>
        <button
          onClick={() => openForm("new")}
          className="min-h-11 rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo productor
        </button>
      </div>

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
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay productores.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">CUIT</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Fincas</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.producto_cuit} className="border-t border-slate-100">
                  <td className="p-3 font-medium whitespace-nowrap">{p.producto_cuit}</td>
                  <td className="p-3">{p.producto_nombre}</td>
                  <td className="p-3">
                    {p.fincas.length === 0 ? (
                      <span className="text-slate-400">{dash}</span>
                    ) : (
                      <span className="text-slate-600">
                        {p.fincas.map((f) => f.finca_nombre).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="space-x-1 p-3 text-right whitespace-nowrap">
                    <button onClick={() => openForm(p)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(p)} className="min-h-11 px-2 text-red-600">
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
        title={editing === "new" ? "Nuevo productor" : "Editar productor"}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          {formError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium">
            CUIT
            <input
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              disabled={editing !== "new"}
              placeholder="Ej.: 20-12345678-3"
            />
            {editing !== "new" && (
              <span className="mt-1 block text-xs text-slate-500">
                El CUIT no se puede modificar.
              </span>
            )}
            {fieldErrors.producto_cuit && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.producto_cuit}</span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Nombre
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Pérez, Juan"
            />
            {fieldErrors.producto_nombre && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.producto_nombre}</span>
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

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar productor"
        message={`¿Eliminar "${toDelete?.producto_nombre}" (${toDelete?.producto_cuit})? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.producto_cuit)}
      />
    </div>
  );
}
