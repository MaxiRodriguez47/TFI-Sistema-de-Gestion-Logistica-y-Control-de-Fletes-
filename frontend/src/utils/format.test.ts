import { formatKg, formatMoney, formatToneladas, dash } from "./format";

describe("format", () => {
  it("formatea kg con separador es-AR", () => {
    expect(formatKg(20500)).toBe("20.500 kg");
  });
  it("formatea moneda ARS", () => {
    expect(formatMoney(174250)).toContain("174.250,00");
  });
  it("convierte a toneladas", () => {
    expect(formatToneladas(20500)).toBe("20,5 t");
  });
  it("muestra guion para null", () => {
    expect(formatKg(null)).toBe(dash);
  });
});
