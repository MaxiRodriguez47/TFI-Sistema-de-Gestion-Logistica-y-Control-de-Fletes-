import type { Viaje } from "../types/api";

export interface GrupoDashboard {
  nombre: string;
  viajes: number;
  neto: number;
  flete: number;
}

/** Agrupa viajes por una clave y ordena por kg netos descendente. */
export function agruparViajes(
  viajes: Viaje[],
  clave: (v: Viaje) => string,
): GrupoDashboard[] {
  const mapa = new Map<string, GrupoDashboard>();
  for (const viaje of viajes) {
    const nombre = clave(viaje);
    const grupo = mapa.get(nombre) ?? { nombre, viajes: 0, neto: 0, flete: 0 };
    grupo.viajes += 1;
    grupo.neto += viaje.peso_neto_kg;
    grupo.flete += viaje.flete;
    mapa.set(nombre, grupo);
  }
  return [...mapa.values()].sort(
    (a, b) => b.neto - a.neto || a.nombre.localeCompare(b.nombre, "es"),
  );
}
