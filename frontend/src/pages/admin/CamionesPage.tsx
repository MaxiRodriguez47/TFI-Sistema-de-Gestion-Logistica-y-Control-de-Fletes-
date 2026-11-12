import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCamion, deleteCamion, listCamiones } from "../../api/camiones";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { parseError } from "../../utils/errors";
import type { Camion } from "../../types/api";

const CAMIONES_KEY = ["camiones"];

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

export default function CamionesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: CAMIONES_KEY, queryFn: listCamiones });

  const [creating, setCreating] = useState(false);
  const [patente, setPatente] = useState("");
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Camion | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm() {
    setCreating(true);
    setPatente("");
    setFormError("");
  }

  const save = useMutation({
    mutationFn: () => createCamion({ camion_patente: patente.trim().toUpperCase() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMIONES_KEY });
      setNotice({ type: "ok", text: "Camión guardado" });
      setCreating(false);
    },
    onError: (e) => setFormError(parseError(e).message),
  });

  const remove = useMutation({
    mutationFn: (patenteCamion: string) => deleteCamion(patenteCamion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMIONES_KEY });
      setNotice({ type: "ok", text: "Camión eliminado" });
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
    const valor = patente.trim();
    if (valor.length < 6 || valor.length > 10) {
      setFormError("La patente debe tener entre 6 y 10 caracteres");
      return;
    }
    setFormError("");
    save.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Camiones</h1>
        <button onClick={openForm} className="min-h-11 rounded-md bg-emerald-700 px-4 text-white">
          Nuevo camión
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
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay camiones.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Patente</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.camion_patente} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{c.camion_patente}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setToDelete(c)} className="min-h-11 px-2 text-red-600">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        La patente es la única propiedad del camión, así que no hay edición: se crea o se elimina.
      </p>

      <Modal open={creating} title="Nuevo camión" onClose={() => setCreating(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          {formError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium">
            Patente
            <input
              className={`${inputClass} uppercase`}
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="Ej.: AB123CD"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Se guarda en mayúsculas, entre 6 y 10 caracteres.
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
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
        title="Eliminar camión"
        message={`¿Eliminar el camión ${toDelete?.camion_patente}? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.camion_patente)}
      />
    </div>
  );
}
