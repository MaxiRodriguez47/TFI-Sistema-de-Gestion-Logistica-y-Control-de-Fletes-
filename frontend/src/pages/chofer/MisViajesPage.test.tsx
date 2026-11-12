import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MisViajesPage from "./MisViajesPage";
import { listMisViajes } from "../../api/viajes";
import { choferUser, makeViaje, renderWithProviders } from "../../test/utils";

vi.mock("../../api/viajes", () => ({ listMisViajes: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MisViajesPage", () => {
  it("muestra las tarjetas del chofer sin acciones de baja", async () => {
    vi.mocked(listMisViajes).mockResolvedValue([
      makeViaje({
        id_viaje: "V001",
        num_vale: "VAL-001",
        peso_neto_kg: 20000,
        flete: 160000,
      }),
    ]);

    renderWithProviders(<MisViajesPage />, { user: choferUser });

    expect(await screen.findByText("V001")).toBeInTheDocument();
    expect(screen.getByText("Vale VAL-001")).toBeInTheDocument();
    expect(screen.getByText("La Esperanza")).toBeInTheDocument();
    expect(screen.getByText("20.000 kg")).toBeInTheDocument();
    expect(screen.getByText(/160\.000,00/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/mis-viajes/V001",
    );
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
    expect(listMisViajes).toHaveBeenCalledWith({ skip: 0, limit: 11 });
  });

  it("pagina de a 10 viajes y detecta la página siguiente", async () => {
    const viajes = Array.from({ length: 11 }, (_, i) =>
      makeViaje({
        id_viaje: `V${String(i + 1).padStart(3, "0")}`,
        num_vale: `VAL-${String(i + 1).padStart(3, "0")}`,
      }),
    );
    vi.mocked(listMisViajes).mockResolvedValue(viajes);

    renderWithProviders(<MisViajesPage />, { user: choferUser });

    await screen.findByText("V001");
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("Página 1 · 10 viajes en esta página")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(listMisViajes).toHaveBeenCalledWith({ skip: 10, limit: 11 }),
    );
    expect(await screen.findByText("Página 2 · 10 viajes en esta página")).toBeInTheDocument();
  });
});
