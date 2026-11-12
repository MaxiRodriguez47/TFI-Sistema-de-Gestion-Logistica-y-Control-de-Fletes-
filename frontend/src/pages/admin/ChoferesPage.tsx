import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChofer,
  deleteChofer,
  listChoferes,
  updateChofer,
} from "../../api/choferes";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { parseError } from "../../utils/errors";
import { dash } from "../../utils/format";
import type { Chofer } from "../../types/api";

const CHOFERES_KEY = ["choferes"];
const TELEFONO_RE = /^[0-9+\-\s]+$/;

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

export default function ChoferesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: CHOFERES_KEY, queryFn: listChoferes });

  const [editing, setEditing] = useState<Chofer | "new" | null>(null);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefonos, setTelefonos] = useState<string[]>([""]);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Chofer | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openForm(c: Chofer | "new") {
    setEditing(c);
    setDni(c === "new" ? "" : c.chofer_dni);
    setNombre(c === "new" ? "" : c.chofer_nombre);
    setTelefonos(c === "new" || c.telefonos.length === 0 ? [""] : [...c.telefonos]);
    setFormError("");
    setFieldErrors({});
  }

  const save = useMutation({
    mutationFn: () => {
      const body = {
        chofer_dni: dni.trim(),
        chofer_nombre: nombre.trim(),
        telefonos: telefonos.map((t) => t.trim()).filter(Boolean),
      };
      return editing === "new"
        ? createChofer(body)
        : updateChofer((editing as Chofer).chofer_dni, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHOFERES_KEY });
      setNotice({ type: "ok", text: "Chofer guardado" });
      setEditing(null);
    },
    onError: (e) => {
      const err = parseError(e);
      setFormError(err.message);
      setFieldErrors(err.fieldErrors);
    },
  });

  const remove = useMutation({
    mutationFn: (dniChofer: string) => deleteChofer(dniChofer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHOFERES_KEY });
      setNotice({ type: "ok", text: "Chofer eliminado" });
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

  function setTelefono(indice: number, valor: string) {
    setTelefonos((lista) => lista.map((t, i) => (i === indice ? valor : t)));
  }

  function agregarTelefono() {
    setTelefonos((lista) => [...lista, ""]);
  }

  function quitarTelefono(indice: number) {
    setTelefonos((lista) => {
      const nueva = lista.filter((_, i) => i !== indice);
      return nueva.length === 0 ? [""] : nueva;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!/^\d{6,20}$/.test(dni.trim())) {
      errs.chofer_dni = "El DNI debe tener solo dígitos (6 a 20)";
    }
    if (!nombre.trim() || nombre.trim().length > 100) {
      errs.chofer_nombre = "El nombre es obligatorio (máx. 100 caracteres)";
    }

    const limpios = telefonos.map((t) => t.trim()).filter(Boolean);
    const invalido = limpios.find((t) => t.length < 6 || t.length > 20 || !TELEFONO_RE.test(t));
    if (invalido) {
      errs.telefonos = "Cada teléfono debe tener entre 6 y 20 caracteres (solo números, +, - y espacios)";
    } else if (new Set(limpios).size !== limpios.length) {
      errs.telefonos = "No se pueden repetir teléfonos";
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
        <h1 className="text-xl font-bold">Choferes</h1>
        <button
          onClick={() => openForm("new")}
          className="min-h-11 rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo chofer
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
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay choferes.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">DNI</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfonos</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.chofer_dni} className="border-t border-slate-100">
                  <td className="p-3 font-medium whitespace-nowrap">{c.chofer_dni}</td>
                  <td className="p-3">{c.chofer_nombre}</td>
                  <td className="p-3">
                    {c.telefonos.length === 0 ? (
                      <span className="text-slate-400">{dash}</span>
                    ) : (
                      <span className="text-slate-600">{c.telefonos.join(", ")}</span>
                    )}
                  </td>
                  <td className="space-x-1 p-3 text-right whitespace-nowrap">
                    <button onClick={() => openForm(c)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
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

      <Modal
        open={!!editing}
        title={editing === "new" ? "Nuevo chofer" : "Editar chofer"}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          {formError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium">
            DNI
            <input
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              disabled={editing !== "new"}
              inputMode="numeric"
              placeholder="Ej.: 30111222"
            />
            {editing !== "new" && (
              <span className="mt-1 block text-xs text-slate-500">El DNI no se puede modificar.</span>
            )}
            {fieldErrors.chofer_dni && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.chofer_dni}</span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Nombre
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Gómez, Luis"
            />
            {fieldErrors.chofer_nombre && (
              <span className="mt-1 block text-sm text-red-700">{fieldErrors.chofer_nombre}</span>
            )}
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Teléfonos</legend>
            {telefonos.map((telefono, indice) => (
              <div key={indice} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={telefono}
                  onChange={(e) => setTelefono(indice, e.target.value)}
                  placeholder="Ej.: 3865400001"
                  aria-label={`Teléfono ${indice + 1}`}
                />
                <button
                  type="button"
                  onClick={() => quitarTelefono(indice)}
                  aria-label={`Quitar teléfono ${indice + 1}`}
                  className="min-h-11 min-w-11 rounded-md border border-slate-300 px-2 text-slate-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={agregarTelefono}
              className="min-h-11 rounded-md border border-slate-300 px-3 text-sm"
            >
              Agregar teléfono
            </button>
            {fieldErrors.telefonos && (
              <p className="text-sm text-red-700">{fieldErrors.telefonos}</p>
            )}
          </fieldset>

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
        title="Eliminar chofer"
        message={`¿Eliminar a "${toDelete?.chofer_nombre}" (DNI ${toDelete?.chofer_dni})? Esta acción no se puede deshacer.`}
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.chofer_dni)}
      />
    </div>
  );
}
