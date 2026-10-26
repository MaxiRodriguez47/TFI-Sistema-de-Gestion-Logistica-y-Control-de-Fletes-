import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "../auth/useAuth";
import axios from "axios";

export default function LoginPage() {
  const { user, signIn, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.rol)} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      setError("Ingresá usuario y contraseña");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const u = await signIn(usuario.trim(), password);
      navigate(homeFor(u.rol), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) setError("No se pudo conectar con el servidor");
        else if (err.response.status === 401) setError("Usuario o contraseña incorrectos");
        else if (typeof err.response.data?.detail === "string") setError(err.response.data.detail);
        else setError("Ocurrió un error inesperado");
      } else setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <div className="text-center">
          <h1 className="text-xl font-bold text-emerald-800">Logística Agro</h1>
          <p className="text-sm text-slate-600">Gestión Logística y Control de Fletes</p>
        </div>

        {sessionExpired && !error && (
          <p role="alert" className="rounded bg-amber-50 p-2 text-sm text-amber-800">
            Tu sesión expiró. Volvé a ingresar.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Usuario
          <input
            className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Contraseña
          <div className="mt-1 flex gap-2">
            <input
              type={showPwd ? "text" : "password"}
              className="block min-h-11 w-full rounded-md border border-slate-300 px-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="min-h-11 rounded-md border border-slate-300 px-3 text-sm"
            >
              {showPwd ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>
        <button
          disabled={loading}
          className="min-h-11 w-full rounded-md bg-emerald-700 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
