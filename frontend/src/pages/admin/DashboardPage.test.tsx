import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";
import { listAllViajes } from "../../api/viajes";
import { listFincas } from "../../api/fincas";
import { listChoferes } from "../../api/choferes";
import { listCamiones } from "../../api/camiones";
import { listIngenios } from "../../api/ingenios";
import { makeViaje, renderWithProviders } from "../../test/utils";
import type { Finca } from "../../types/api";

vi.mock("../../api/viajes", () => ({ listAllViajes: vi.fn() }));
vi.mock("../../api/fincas", () => ({ listFincas: vi.fn() }));
vi.mock("../../api/choferes", () => ({ listChoferes: vi.fn() }));
vi.mock("../../api/camiones", () => ({ listCamiones: vi.fn() }));
vi.mock("../../api/ingenios", () => ({ listIngenios: vi.fn() }));

const fincaBase: Finca = {
  id_finca: 1,
  finca_nombre: "La Esperanza",
  id_localidad: 1,
  localidad: { id_localidad: 1, localidad_nombre: "Villa", departamento: "Cruz Alta" },
  productores: [],
};

/** Devuelve el contenedor de un KPI a partir de su etiqueta. */
function kpi(label: string) {
  const etiqueta = screen
    .getAllByText(label)
    .find((el) => el.tagName === "P" && el.className.includes("uppercase"));
  if (!etiqueta?.parentElement) throw new Error(`No se encontró el KPI "${label}"`);
  return within(etiqueta.parentElement);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listFincas).mockResolvedValue([
    fincaBase,
    { ...fincaBase, id_finca: 2, finca_nombre: "El Sol" },
    { ...fincaBase, id_finca: 3, finca_nombre: "Los Álamos" },
  ]);
  vi.mocked(listChoferes).mockResolvedValue([
    { chofer_dni: "30111222", chofer_nombre: "Gómez, Luis", telefonos: [] },
    { chofer_dni: "28444555", chofer_nombre: "Pérez, Ana", telefonos: [] },
  ]);
  vi.mocked(listCamiones).mockResolvedValue([{ camion_patente: "AB123CD" }]);
  vi.mocked(listIngenios).mockResolvedValue([{ id_ingenio: 1, ingenio_nombre: "Ingenio Central" }]);
});

describe("DashboardPage", () => {
  it("calcula totales, promedios y ranking con todos los viajes", async () => {
    vi.mocked(listAllViajes).mockResolvedValue([
      makeViaje({
        id_viaje: "V001",
        peso_neto_kg: 20000,
        flete: 160000,
        chofer_dni: "30111222",
        chofer: { chofer_dni: "30111222", chofer_nombre: "Gómez, Luis" },
      }),
      makeViaje({
        id_viaje: "V002",
        peso_neto_kg: 30000,
        flete: 240000,
        chofer_dni: "28444555",
        chofer: { chofer_dni: "28444555", chofer_nombre: "Pérez, Ana" },
      }),
    ]);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("Kg netos transportados")).toBeInTheDocument();

    expect(kpi("Viajes").getByText("2")).toBeInTheDocument();
    expect(kpi("Kg netos transportados").getByText("50.000 kg")).toBeInTheDocument();
    expect(kpi("Fletes").getByText(/400\.000,00/)).toBeInTheDocument();
    expect(kpi("Choferes").getByText("2")).toBeInTheDocument();
    expect(kpi("Camiones").getByText("1")).toBeInTheDocument();
    expect(kpi("Fincas").getByText("3")).toBeInTheDocument();
    expect(kpi("Ingenios").getByText("1")).toBeInTheDocument();
    expect(kpi("Promedio por viaje").getByText("25.000 kg")).toBeInTheDocument();

    expect(screen.getByText("Kg netos y fletes por ingenio")).toBeInTheDocument();
    expect(screen.getByText("Kg netos y fletes por finca")).toBeInTheDocument();

    const tabla = screen.getByRole("table");
    const filas = within(tabla).getAllByRole("row");
    expect(within(filas[1]).getByText("Pérez, Ana")).toBeInTheDocument();
    expect(within(filas[1]).getByText("30.000 kg")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Gómez, Luis")).toBeInTheDocument();
    expect(within(filas[2]).getByText("20.000 kg")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay viajes", async () => {
    vi.mocked(listAllViajes).mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("Todavía no hay viajes registrados.")).toBeInTheDocument();
    expect(kpi("Kg netos transportados").getByText("0 kg")).toBeInTheDocument();
    expect(kpi("Promedio por viaje").getByText("—")).toBeInTheDocument();
    expect(screen.getAllByText("Sin viajes registrados.")).toHaveLength(3);
  });
});
