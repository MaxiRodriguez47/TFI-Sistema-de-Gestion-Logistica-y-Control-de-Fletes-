const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export const dash = "—";

export function formatKg(v: number | null | undefined): string {
  return v == null ? dash : `${num.format(v)} kg`;
}

export function formatMoney(v: number | null | undefined): string {
  return v == null ? dash : ars.format(v);
}

export function formatNumber(v: number | null | undefined): string {
  return v == null ? dash : num.format(v);
}

export function formatToneladas(kg: number | null | undefined): string {
  return kg == null
    ? dash
    : `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 }).format(kg / 1000)} t`;
}
