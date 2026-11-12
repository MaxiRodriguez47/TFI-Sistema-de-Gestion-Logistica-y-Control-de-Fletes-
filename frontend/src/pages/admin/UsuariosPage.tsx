import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUsuario, listUsuarios, updateUsuario } from "../../api/usuarios";
import { listChoferes } from "../../api/choferes";
import Modal from "../../components/Modal";
import { useAuth } from "../../auth/useAuth";
import { parseError } from "../../utils/errors";
import { dash } from "../../utils/format";
import type { Rol, Usuario, UsuarioUpdateInput } from "../../types/api";

const USUARIOS_KEY = ["usuarios"];
const CHOFERES_KEY = ["choferes"];

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

function badgeEstado(activo: boolean) {
  return activo
    ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
    : "rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700";
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: USUARIOS_KEY, queryFn: listUsuarios });
  const { data: choferes } = useQuery({ queryKey: CHOFERES_KEY, queryFn: listChoferes });

  const [creating, setCreating] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState<Rol>("CHOFER");
  const [nuevoChoferDni, setNuevoChoferDni] = useState("");
  const [createError, setCreateError] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editActivo, setEditActivo] = useState(true);
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const disponibles =
    choferes?.filter(
      (c) => !data?.some((u) => u.chofer_dni === c.chofer_dni),
    ) ?? [];

  function openCreate() {
    setCreating(true);
    setNuevoUsuario("");
    setNuevaPassword("");
    setNuevoRol("CHOFER");
    setNuevoChoferDni("");
    setCreateError("");
    setCreateFieldErrors({});
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setEditPassword("");
    setEditActivo(u.activo);
    setEditError("");
    setEditFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: () =>
      createUsuario({
        usuario_nombre: nuevoUsuario.trim(),
        password: nuevaPassword,
        rol: nuevoRol,
        chofer_dni: nuevoRol === "CHOFER" ? nuevoChoferDni : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USUARIOS_KEY });
      setNotice({ type: "ok", text: "Usuario creado" });
      setCreating(false);
    },
    onError: (e) => {
      const err = parseError(e);
      setCreateError(err.message);
      setCreateFieldErrors(err.fieldErrors);
    },
  });

  const actualizar = useMutation({
    mutationFn: () => {
      const payload: UsuarioUpdateInput = {};
      if (editPassword.trim()) payload.password = editPassword;
      if (editing && editing.id_usuario !== user?.id_usuario) payload.activo = editActivo;
      return updateUsuario(editing!.id_usuario, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USUARIOS_KEY });
      setNotice({ type: "ok", text: "Usuario actualizado" });
      setEditing(null);
    },
    onError: (e) => {
      const err = parseError(e);
      setEditError(err.message);
      setEditFieldErrors(err.fieldErrors);
    },
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (nuevoUsuario.trim().length < 3 || nuevoUsuario.trim().length > 50) {
      errs.usuario_nombre = "El usuario debe tener entre 3 y 50 caracteres";
    }
    if (nuevaPassword.length < 8 || nuevaPassword.length > 128) {
      errs.password = "La contraseña debe tener entre 8 y 128 caracteres";
    }
    if (nuevoRol === "CHOFER" && !nuevoChoferDni) {
      errs.chofer_dni = "Seleccioná el chofer que usará esta cuenta";
    }
    setCreateFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setCreateError("Revisá los datos ingresados");
      return;
    }
    setCreateError("");
    crear.mutate();
  }

  function onEdit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (editPassword.trim() && (editPassword.length < 8 || editPassword.length > 128)) {
      errs.password = "La contraseña debe tener entre 8 y 128 caracteres";
    }
    setEditFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setEditError("Revisá los datos ingresados");
      return;
    }

    const esPropio = editing?.id_usuario === user?.id_usuario;
    const cambiaPassword = Boolean(editPassword.trim());
    const cambiaEstado = !esPropio && editing?.activo !== editActivo;
    if (!cambiaPassword && !cambiaEstado) {
      setEditError("No hay cambios para guardar");
      return;
    }

    setEditError("");
    actualizar.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Usuarios</h1>
        <button
          onClick={openCreate}
          className="min-h-11 rounded-md bg-emerald-700 px-4 text-white"
        >
          Nuevo usuario
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

      <p className="mb-3 rounded bg-slate-100 p-2 text-xs text-slate-600">
        No se eliminan usuarios: desactivar una cuenta equivale a darla de baja.
      </p>

      {isLoading && <p className="text-slate-600">Cargando…</p>}
      {error && <p className="text-red-700">{parseError(error).message}</p>}
      {data && data.length === 0 && <p className="text-slate-600">Todavía no hay usuarios.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Chofer</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id_usuario} className="border-t border-slate-100">
                  <td className="p-3 font-medium">
                    {u.usuario_nombre}
                    {u.id_usuario === user?.id_usuario && (
                      <span className="ml-2 text-xs text-slate-500">(vos)</span>
                    )}
                  </td>
                  <td className="p-3">{u.rol}</td>
                  <td className="p-3">
                    {u.chofer_nombre ? (
                      <span>
                        {u.chofer_nombre}{" "}
                        <span className="text-xs text-slate-500">({u.chofer_dni})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">{dash}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={badgeEstado(u.activo)}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="min-h-11 px-2 text-emerald-700">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} title="Nuevo usuario" onClose={() => setCreating(false)}>
        <form onSubmit={onCreate} className="space-y-3">
          {createError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {createError}
            </p>
          )}
          <label className="block text-sm font-medium">
            Usuario
            <input
              className={inputClass}
              value={nuevoUsuario}
              onChange={(e) => setNuevoUsuario(e.target.value)}
              placeholder="Ej.: nuevo.chofer"
            />
            {createFieldErrors.usuario_nombre && (
              <span className="mt-1 block text-sm text-red-700">
                {createFieldErrors.usuario_nombre}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              type="password"
              className={inputClass}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            {createFieldErrors.password && (
              <span className="mt-1 block text-sm text-red-700">{createFieldErrors.password}</span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Rol
            <select
              className={inputClass}
              value={nuevoRol}
              onChange={(e) => {
                const rol = e.target.value as Rol;
                setNuevoRol(rol);
                if (rol === "ADMIN") setNuevoChoferDni("");
              }}
            >
              <option value="CHOFER">CHOFER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          {nuevoRol === "CHOFER" && (
            <label className="block text-sm font-medium">
              Chofer vinculado
              <select
                className={inputClass}
                value={nuevoChoferDni}
                onChange={(e) => setNuevoChoferDni(e.target.value)}
              >
                <option value="">Seleccioná un chofer</option>
                {disponibles.map((c) => (
                  <option key={c.chofer_dni} value={c.chofer_dni}>
                    {c.chofer_nombre} — {c.chofer_dni}
                  </option>
                ))}
              </select>
              {disponibles.length === 0 && (
                <span className="mt-1 block text-xs text-amber-700">
                  No hay choferes sin usuario.{" "}
                  <Link to="/admin/choferes" className="font-medium underline">
                    Crear chofer
                  </Link>
                </span>
              )}
              {createFieldErrors.chofer_dni && (
                <span className="mt-1 block text-sm text-red-700">
                  {createFieldErrors.chofer_dni}
                </span>
              )}
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="min-h-11 rounded-md border border-slate-300 px-4"
            >
              Cancelar
            </button>
            <button
              disabled={crear.isPending}
              className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
            >
              {crear.isPending ? "Guardando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} title="Editar usuario" onClose={() => setEditing(null)}>
        <form onSubmit={onEdit} className="space-y-3">
          {editError && (
            <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
              {editError}
            </p>
          )}

          <dl className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Usuario</dt>
              <dd className="font-medium">{editing?.usuario_nombre}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Rol</dt>
              <dd className="font-medium">{editing?.rol}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Chofer</dt>
              <dd className="font-medium">
                {editing?.chofer_nombre ?? dash}
                {editing?.chofer_dni ? ` (${editing.chofer_dni})` : ""}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500">
            El usuario, el rol y el chofer no se pueden modificar.
          </p>

          <label className="block text-sm font-medium">
            Nueva contraseña
            <input
              type="password"
              className={inputClass}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Dejar en blanco para no cambiarla"
            />
            {editFieldErrors.password && (
              <span className="mt-1 block text-sm text-red-700">{editFieldErrors.password}</span>
            )}
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={editActivo}
              disabled={editing?.id_usuario === user?.id_usuario}
              onChange={(e) => setEditActivo(e.target.checked)}
              className="h-5 w-5"
            />
            Cuenta activa
          </label>
          {editing?.id_usuario === user?.id_usuario ? (
            <p className="text-xs text-slate-500">No podés desactivar tu propia cuenta.</p>
          ) : (
            <p className="text-xs text-slate-500">
              Desmarcar esta opción da de baja la cuenta (no se elimina).
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 rounded-md border border-slate-300 px-4"
            >
              Cancelar
            </button>
            <button
              disabled={actualizar.isPending}
              className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
            >
              {actualizar.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
