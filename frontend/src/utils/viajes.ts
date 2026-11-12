/** Reglas numéricas compartidas por los formularios de viajes. */

export const DECIMAL_RE = /^\d{1,8}([.,]\d{1,2})?$/;

/** Acepta coma o punto decimal. Devuelve null si el valor no es válido. */
export function parseDecimal(valor: string): number | null {
  const limpio = valor.trim().replace(",", ".");
  return DECIMAL_RE.test(limpio) ? Number(limpio) : null;
}

/** flete = round((neto_kg / 1000) * tarifa_ton, 2) */
export function calcularFlete(netoKg: number, tarifaTon: number): number {
  return Math.round((netoKg / 1000) * tarifaTon * 100) / 100;
}
