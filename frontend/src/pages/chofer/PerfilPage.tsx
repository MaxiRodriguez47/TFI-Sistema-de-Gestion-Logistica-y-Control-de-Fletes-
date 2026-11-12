import { useAuth } from "../../auth/useAuth";
import { dash } from "../../utils/format";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const filas: [string, string][] = [
    ["Usuario", user.usuario_nombre],
    ["Rol", user.rol],
    ["Chofer", user.chofer_nombre ?? dash],
    ["DNI", user.chofer_dni ?? dash],
    ["Estado", user.activo ? "Activo" : "Inactivo"],
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Mi perfil</h1>

      <dl className="divide-y divide-slate-100 rounded-lg bg-white shadow">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <dt className="text-slate-600">{etiqueta}</dt>
            <dd className="font-medium">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-slate-500">
        Los datos personales no se pueden editar desde acá. Si necesitás un cambio, contactá a un
        administrador.
      </p>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 min-h-11 w-full rounded-md border border-slate-300 px-4 hover:bg-slate-100"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
