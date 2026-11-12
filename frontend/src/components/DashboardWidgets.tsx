import { formatKg, formatMoney } from "../utils/format";
import type { GrupoDashboard } from "../utils/dashboard";

export function Kpi({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}

export function Distribucion({
  titulo,
  grupos,
  vacio = "Sin viajes registrados.",
}: {
  titulo: string;
  grupos: GrupoDashboard[];
  vacio?: string;
}) {
  const maximo = Math.max(0, ...grupos.map((g) => g.neto));

  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 text-base font-semibold">{titulo}</h2>
      {grupos.length === 0 ? (
        <p className="text-sm text-slate-600">{vacio}</p>
      ) : (
        <ul className="space-y-3">
          {grupos.map((g) => (
            <li key={g.nombre}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-medium">{g.nombre}</span>
                <span className="text-slate-600">
                  {formatKg(g.neto)} · {formatMoney(g.flete)} ·{" "}
                  {g.viajes} viaje{g.viajes === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1 h-2 rounded bg-slate-100" aria-hidden="true">
                <div
                  className="h-2 rounded bg-emerald-600"
                  style={{ width: `${maximo > 0 ? (g.neto / maximo) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
