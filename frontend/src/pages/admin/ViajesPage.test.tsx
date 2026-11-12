import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosError } from "axios";
import ViajesPage from "./ViajesPage";
import { deleteViaje, listViajes } from "../../api/viajes";
import { listFincas } from "../../api/fincas";
import { listIngenios } from "../../api/ingenios";
import { listChoferes } from "../../api/choferes";
import { listCamiones } from "../../api/camiones";
import { listProductos } from "../../api/productos";
import { makeViaje, renderWithProviders } from "../../test/utils";

vi.mock("../../api/viajes", () => ({
  listViajes: vi.fn(),
  deleteViaje: vi.fn(),
}));
vi.mock("../../api/fincas", () => ({ listFincas: vi.fn() }));
vi.mock("../../api/ingenios", () => ({ listIngenios: vi.fn() }));
vi.mock("../../api/choferes", () => ({ listChoferes: vi.fn() }));
vi.mock("../../api/camiones", () => ({ listCamiones: vi.fn() }));
vi.mock("../../api/productos", () => ({ listProductos: vi.fn() }));

function axiosError(status: number, data: unknown): AxiosError {
  return { isAxiosError: true, response: { status, data } } as unknown as AxiosError;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listFincas).mockResolvedValue([]);
  vi.mocked(listIngenios).mockResolvedValue([]);
  vi.mocked(listChoferes).mockResolvedValue([]);
  vi.mocked(listCamiones).mockResolvedValue([]);
  vi.mocked(listProductos).mockResolvedValue([]);
});

describe("ViajesPage", () => {
  it("lista los viajes con pesos y flete formateados", async () => {
    vi.mocked(listViajes).mockResolvedValue([
      makeViaje({
        id_viaje: "V001",
        num_vale: "VAL-001",
        peso_bruto_kg: 30000,
        tara_kg: 10000,
        peso_neto_kg: 20000,
        flete: 160000,
      }),
    ]);

    renderWithProviders(<ViajesPage />);

    expect(await screen.findByText("V001")).toBeInTheDocument();
    expect(screen.getByText("VAL-001")).toBeInTheDocument();
    expect(screen.getByText("20.000 kg")).toBeInTheDocument();
    expect(screen.getByText(/160\.000,00/)).toBeInTheDocument();
    expect(listViajes).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, limit: 11 }),
    );
  });

  it("aplica el filtro de finca y vuelve a la primera página", async () => {
    vi.mocked(listViajes).mockResolvedValue([makeViaje({ id_viaje: "V001" })]);
    vi.mocked(listFincas).mockResolvedValue([
      {
        id_finca: 2,
        finca_nombre: "El Sol",
        id_localidad: 1,
        localidad: { id_localidad: 1, localidad_nombre: "Villa", departamento: "Cruz Alta" },
        productores: [],
      },
    ]);

    renderWithProviders(<ViajesPage />);

    const select = await screen.findByLabelText(/finca/i);
    await waitFor(() =>
      expect(within(select).getByRole("option", { name: "El Sol" })).toBeInTheDocument(),
    );

    fireEvent.change(select, { target: { value: "2" } });

    await waitFor(() =>
      expect(listViajes).toHaveBeenCalledWith(
        expect.objectContaining({ id_finca: 2, skip: 0, limit: 11 }),
      ),
    );
    expect(await screen.findByRole("button", { name: "Limpiar filtros" })).toBeInTheDocument();
  });

  it("muestra el motivo cuando el backend rechaza la baja con 409", async () => {
    vi.mocked(listViajes).mockResolvedValue([makeViaje({ id_viaje: "V001", num_vale: "VAL-001" })]);
    vi.mocked(deleteViaje).mockRejectedValue(
      axiosError(409, { detail: "El viaje está asociado a una liquidación" }),
    );

    renderWithProviders(<ViajesPage />);

    await screen.findByText("V001");
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/¿Eliminar el viaje V001/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No se puede eliminar: El viaje está asociado a una liquidación",
    );
    expect(deleteViaje).toHaveBeenCalledWith("V001");
  });
});
