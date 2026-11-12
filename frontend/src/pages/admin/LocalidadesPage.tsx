import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLocalidad, deleteLocalidad, listLocalidades, updateLocalidad } from "../../api/localidades";
import ConfirmDialog from "../../components/ConfirmDialog";
import { parseError } from "../../utils/errors";
import type { Localidad } from "../../types/api";

const KEY = ["localidades"];

export default function LocalidadesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: KEY, queryFn: listLocalidades });

  const [editing, setEditing] = useState<Localidad | "new" | null>(null);
  const [nombre, setNombre] = useState("");
  const [depto, setDepto] = useState("");
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Localidad | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm(l: Localidad | "new") {
    setEditing(l);
    setNombre(l === "new" ? "" : l.localidad_nombre);
    setDepto(l === "new" ? "" : l.departamento);
    setFormError("");
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { localidad_nombre: nombre.trim(), departamento: depto.trim() };
      return editing === "new"
        ? createLocalidad(body)
        : updateLocalidad((editing as Localidad).id_localidad, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      setNotice({ type: "ok", text: "Localidad guardada" });
      setEditing(null);
    },
    onError: (e) => setFormError(parseError(e).message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteLocalidad(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      setNotice({ type: "ok", text: "Localidad eliminada" });
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
    if (!nombre.trim() || nombre.length > 100 || !depto.trim() || depto.length > 100) {
      setFormError("Localidad y departamento son obligatorios (máx. 100 caracteres)");
      return;
    }
    save.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Localidades</h1>
        <button onClick={() => openForm("new")} className="min-h-11 rounded-md bg-emerald-700 px-4 text-white">
          Nueva localidad
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
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay localidades.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Localidad</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Fincas</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l.id_localidad} className="border-t border-slate-100">
                  <td className="p-3">{l.id_localidad}</td>
                  <td className="p-3">{l.localidad_nombre}</td>
                  <td className="p-3">{l.departamento}</td>
                  <td className="p-3">{l.fincas.length}</td>
                  <td className="space-x-2 p-3 text-right">
                    <button onClick={() => openForm(l)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(l)} className="min-h-11 px-2 text-red-600">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 rounded-xl bg-white p-5 shadow">
            <h2 className="text-lg font-semibold">{editing === "new" ? "Nueva localidad" : "Editar localidad"}</h2>
            {formError && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{formError}</p>}
            <label className="block text-sm font-medium">
              Localidad
              <input className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Departamento
              <input className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3" value={depto} onChange={(e) => setDepto(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-md border border-slate-300 px-4">
                Cancelar
              </button>
              <button disabled={save.isPending} className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60">
                {save.isPending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar localidad"
        message={`¿Eliminar "${toDelete?.localidad_nombre}"? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id_localidad)}
      />
    </div>
  );
}
