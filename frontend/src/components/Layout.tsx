import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const adminLinks = [
  ["/admin", "Dashboard"],
  ["/admin/viajes", "Viajes"],
  ["/admin/localidades", "Localidades"],
  ["/admin/fincas", "Fincas"],
  ["/admin/productores", "Productores"],
  ["/admin/camiones", "Camiones"],
  ["/admin/choferes", "Choferes"],
  ["/admin/ingenios", "Ingenios"],
  ["/admin/usuarios", "Usuarios"],
] as const;

const choferLinks = [
  ["/mis-viajes", "Mis viajes"],
  ["/mis-viajes/nuevo", "Nuevo viaje"],
  ["/perfil", "Mi perfil"],
] as const;

export default function Layout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const links = user.rol === "ADMIN" ? adminLinks : choferLinks;
  const nombre = user.chofer_nombre ?? user.usuario_nombre;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2.5 text-sm font-medium ${
      isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div className="min-h-screen md:flex">
      <aside
        className={`${open ? "block" : "hidden"} border-b border-slate-200 bg-white p-3 md:block md:w-56 md:shrink-0 md:border-b-0 md:border-r`}
      >
        <p className="mb-3 hidden px-3 text-sm font-bold text-emerald-800 md:block">Logística Agro</p>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="order-first flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 md:order-none">
          <button
            className="min-h-11 min-w-11 rounded-md border border-slate-300 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className="font-semibold text-emerald-800 md:hidden">Logística Agro</span>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-700">
              {nombre} <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{user.rol}</span>
            </span>
            <button
              onClick={signOut}
              className="min-h-11 rounded-md border border-slate-300 px-3 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
