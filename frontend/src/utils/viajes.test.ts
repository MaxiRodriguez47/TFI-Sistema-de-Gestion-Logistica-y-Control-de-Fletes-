import { calcularFlete, parseDecimal } from "./viajes";

describe("parseDecimal", () => {
  it("acepta enteros", () => {
    expect(parseDecimal("0")).toBe(0);
    expect(parseDecimal("32500")).toBe(32500);
    expect(parseDecimal("12345678")).toBe(12345678);
  });

  it("acepta coma o punto como separador decimal", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("12.5")).toBe(12.5);
    expect(parseDecimal("0,05")).toBe(0.05);
  });

  it("ignora espacios alrededor", () => {
    expect(parseDecimal("  1500,75  ")).toBe(1500.75);
  });

  it("rechaza vacíos, texto y negativos", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("   ")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("-5")).toBeNull();
    expect(parseDecimal("1e3")).toBeNull();
  });

  it("rechaza más de 2 decimales o más de 8 enteros", () => {
    expect(parseDecimal("1,234")).toBeNull();
    expect(parseDecimal("1.234")).toBeNull();
    expect(parseDecimal("123456789")).toBeNull();
  });

  it("rechaza separadores mal ubicados", () => {
    expect(parseDecimal(",5")).toBeNull();
    expect(parseDecimal("1.")).toBeNull();
    expect(parseDecimal("1,2,3")).toBeNull();
  });
});

describe("calcularFlete", () => {
  it("multiplica toneladas por la tarifa", () => {
    expect(calcularFlete(20000, 8500)).toBe(170000);
    expect(calcularFlete(32500, 8000)).toBe(260000);
  });

  it("redondea a 2 decimales", () => {
    // (1234 / 1000) * 333,33 = 411,32922
    expect(calcularFlete(1234, 333.33)).toBe(411.33);
  });

  it("devuelve 0 cuando el neto es 0", () => {
    expect(calcularFlete(0, 8500)).toBe(0);
  });
});
