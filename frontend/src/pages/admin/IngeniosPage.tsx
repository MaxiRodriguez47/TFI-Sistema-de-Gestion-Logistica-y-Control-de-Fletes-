import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIngenio,
  deleteIngenio,
  listIngenios,
  updateIngenio,
} from "../../api/ingenios";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { parseError } from "../../utils/errors";
import type { Ingenio } from "../../types/api";

const INGENIOS_KEY = ["ingenios"];

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

export default function IngeniosPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: INGENIOS_KEY, queryFn: listIngenios });

  const [editing, setEditing] = useState<Ingenio | "new" | null>(null);
  const [nombre, setNombre] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Ingenio | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm(i: Ingenio | "new") {
    setEditing(i);
    setNombre(i === "new" ? "" : i.ingenio_nombre);
    setFormError("");
    setFieldErrors({});
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { ingenio_nombre: nombre.trim() };
      return editing === "new"
        ? createIngenio(body)
        : updateIngenio((editing as Ingenio).id_ingenio, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INGENIOS_KEY });
      setNotice({ type: "ok", text: "Ingenio guardado" });
      setEditing(null);
    },
    onError: (e) => {
      const err = parseError(e);
      setFormError(err.message);
      setFieldErrors(err.fieldErrors);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteIngenio(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INGENIOS_KEY });
      setNotice({ type: "ok", text: "Ingenio eliminado" });
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
    if (!nombre.trim() || nombre.trim().length > 100) {
      setFieldErrors({ ingenio_nombre: "El nombre es obligatorio (máx. 100 caracteres)" });
      setFormError("Revisá los datos ingresados");
      return;
    }
    setFieldErrors({});
    setFormError("");
    save.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Ingenios</h1>
        <button
          onClick={() => openForm("new")}
          className="min-h-11 rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo ingenio
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
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay ingenios.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((i) => (
                <tr key={i.id_ingenio} className="border-t border-slate-100">
                  <td className="p-3">{i.id_ingenio}</td>
                  <td className="p-3 font-medium">{i.ingenio_nombre}</td>
                  <td className="space-x-1 p-3 text-right whitespace-nowrap">
                    <button onClick={() => openForm(i)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(i)} className="min-h-11 px-2 text-red-600">
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
        title={editing === "new" ? "Nuevo ingenio" : "Editar ingenio"}
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
              placeholder="Ej.: Ingenio Concepción"
            />
            {fieldErrors.ingenio_nombre && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.ingenio_nombre}</span>
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
        title="Eliminar ingenio"
        message={`¿Eliminar "${toDelete?.ingenio_nombre}"? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id_ingenio)}
      />
    </div>
  );
}
