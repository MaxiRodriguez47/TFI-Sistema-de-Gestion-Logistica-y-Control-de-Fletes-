import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardChoferPage from "./DashboardChoferPage";
import { listAllMisViajes } from "../../api/viajes";
import { choferUser, makeViaje, renderWithProviders } from "../../test/utils";

vi.mock("../../api/viajes", () => ({ listAllMisViajes: vi.fn() }));

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
});

describe("DashboardChoferPage", () => {
  it("resume los viajes propios del chofer", async () => {
    vi.mocked(listAllMisViajes).mockResolvedValue([
      makeViaje({
        id_viaje: "V001",
        peso_neto_kg: 20000,
        flete: 160000,
        ingenio: { id_ingenio: 1, ingenio_nombre: "Ingenio Central" },
        finca: { id_finca: 1, finca_nombre: "La Esperanza" },
        camion: { camion_patente: "AB123CD" },
      }),
      makeViaje({
        id_viaje: "V002",
        peso_neto_kg: 30000,
        flete: 240000,
        ingenio: { id_ingenio: 2, ingenio_nombre: "Ingenio Norte" },
        finca: { id_finca: 2, finca_nombre: "El Sol" },
        camion: { camion_patente: "AB123CD" },
      }),
    ]);

    renderWithProviders(<DashboardChoferPage />, { user: choferUser });

    expect(await screen.findByText("Kg netos transportados")).toBeInTheDocument();
    expect(screen.getByText(/Hola, Gómez, Luis/)).toBeInTheDocument();

    expect(kpi("Viajes").getByText("2")).toBeInTheDocument();
    expect(kpi("Kg netos transportados").getByText("50.000 kg")).toBeInTheDocument();
    expect(kpi("Fletes").getByText(/400\.000,00/)).toBeInTheDocument();
    expect(kpi("Promedio por viaje").getByText("25.000 kg")).toBeInTheDocument();

    const ingenios = screen
      .getByText("Kg netos y fletes por ingenio")
      .closest("section") as HTMLElement;
    expect(within(ingenios).getByText("Ingenio Norte")).toBeInTheDocument();
    expect(within(ingenios).getByText("Ingenio Central")).toBeInTheDocument();
    expect(within(ingenios).getByText(/30\.000 kg/)).toBeInTheDocument();

    const fincas = screen
      .getByText("Kg netos y fletes por finca")
      .closest("section") as HTMLElement;
    expect(within(fincas).getByText("El Sol")).toBeInTheDocument();
    expect(within(fincas).getByText("La Esperanza")).toBeInTheDocument();

    const tabla = screen.getByRole("table");
    const filas = within(tabla).getAllByRole("row");
    expect(within(filas[1]).getByText("AB123CD")).toBeInTheDocument();
    expect(within(filas[1]).getByText("2")).toBeInTheDocument();
    expect(within(filas[1]).getByText("50.000 kg")).toBeInTheDocument();
    expect(within(filas[1]).getByText(/400\.000,00/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Mis viajes" })).toHaveAttribute(
      "href",
      "/mis-viajes",
    );
    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/perfil");
    expect(screen.getAllByRole("link", { name: "Nuevo viaje" })).toHaveLength(2);
  });

  it("muestra el estado vacío cuando todavía no cargó viajes", async () => {
    vi.mocked(listAllMisViajes).mockResolvedValue([]);

    renderWithProviders(<DashboardChoferPage />, { user: choferUser });

    expect(await screen.findByText("Todavía no registraste viajes.")).toBeInTheDocument();
    expect(kpi("Viajes").getByText("0")).toBeInTheDocument();
    expect(kpi("Kg netos transportados").getByText("0 kg")).toBeInTheDocument();
    expect(kpi("Promedio por viaje").getByText("—")).toBeInTheDocument();
    expect(screen.getAllByText("Sin viajes registrados.")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Registrar mi primer viaje" })).toHaveAttribute(
      "href",
      "/mis-viajes/nuevo",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra el error de conexión", async () => {
    vi.mocked(listAllMisViajes).mockRejectedValue({ isAxiosError: true });

    renderWithProviders(<DashboardChoferPage />, { user: choferUser });

    expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
  });
});
