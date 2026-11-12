import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ViajeForm from "./ViajeForm";
import { createViaje } from "../api/viajes";
import { listFincas } from "../api/fincas";
import { listCamiones } from "../api/camiones";
import { listChoferes } from "../api/choferes";
import { listIngenios } from "../api/ingenios";
import { choferUser, makeViaje, renderWithProviders } from "../test/utils";
import type { Finca } from "../types/api";

vi.mock("../api/viajes", () => ({
  createViaje: vi.fn(),
  updateViaje: vi.fn(),
  deleteViaje: vi.fn(),
}));
vi.mock("../api/fincas", () => ({ listFincas: vi.fn() }));
vi.mock("../api/camiones", () => ({ listCamiones: vi.fn() }));
vi.mock("../api/choferes", () => ({ listChoferes: vi.fn() }));
vi.mock("../api/ingenios", () => ({ listIngenios: vi.fn() }));

const finca: Finca = {
  id_finca: 1,
  finca_nombre: "La Esperanza",
  id_localidad: 1,
  localidad: { id_localidad: 1, localidad_nombre: "Villa", departamento: "Cruz Alta" },
  productores: [{ producto_cuit: "20111111112", producto_nombre: "Pérez, Juan" }],
};

const choferFijo = { dni: "30111222", nombre: "Gómez, Luis" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listFincas).mockResolvedValue([finca]);
  vi.mocked(listCamiones).mockResolvedValue([{ camion_patente: "AB123CD" }]);
  vi.mocked(listChoferes).mockResolvedValue([
    { chofer_dni: "30111222", chofer_nombre: "Gómez, Luis", telefonos: [] },
  ]);
  vi.mocked(listIngenios).mockResolvedValue([{ id_ingenio: 1, ingenio_nombre: "Ingenio Central" }]);
});

describe("ViajeForm", () => {
  it("en modo chofer muestra el chofer fijo y calcula neto y flete en vivo", async () => {
    renderWithProviders(
      <ViajeForm modo="chofer" choferFijo={choferFijo} volverA="/mis-viajes" />,
      { user: choferUser },
    );

    expect(await screen.findByText(/Gómez, Luis/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^chofer$/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/peso bruto/i), { target: { value: "30000" } });
    fireEvent.change(screen.getByLabelText(/tara/i), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText(/tarifa/i), { target: { value: "8000" } });

    expect(screen.getByText("20.000 kg")).toBeInTheDocument();
    expect(screen.getByText(/160\.000,00/)).toBeInTheDocument();
  });

  it("en modo admin permite elegir chofer", async () => {
    renderWithProviders(<ViajeForm modo="admin" volverA="/admin/viajes" />);

    const select = await screen.findByLabelText(/chofer/i);
    expect(select.tagName).toBe("SELECT");
    expect(await screen.findByRole("option", { name: /Gómez, Luis/ })).toBeInTheDocument();
  });

  it("valida que la tara no supere el peso bruto sin enviar el formulario", async () => {
    renderWithProviders(
      <ViajeForm modo="chofer" choferFijo={choferFijo} volverA="/mis-viajes" />,
      { user: choferUser },
    );

    fireEvent.change(screen.getByLabelText(/peso bruto/i), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText(/tara/i), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisá los datos ingresados");
    expect(screen.getByText("La tara no puede superar el peso bruto")).toBeInTheDocument();
    expect(createViaje).not.toHaveBeenCalled();
  });

  it("envía el viaje con el DNI del chofer logueado", async () => {
    vi.mocked(createViaje).mockResolvedValue(makeViaje());
    renderWithProviders(
      <ViajeForm modo="chofer" choferFijo={choferFijo} volverA="/mis-viajes" />,
      { user: choferUser },
    );

    fireEvent.change(screen.getByLabelText(/id de viaje/i), { target: { value: "V998" } });
    fireEvent.change(screen.getByLabelText(/n° de vale/i), { target: { value: "VAL-998" } });

    const fincaSelect = screen.getByLabelText(/finca de origen/i);
    await waitFor(() =>
      expect(within(fincaSelect).getByRole("option", { name: /La Esperanza/ })).toBeInTheDocument(),
    );
    fireEvent.change(fincaSelect, { target: { value: "1" } });

    const productorSelect = screen.getByLabelText(/productor/i);
    await waitFor(() =>
      expect(
        within(productorSelect).getByRole("option", { name: /Pérez, Juan/ }),
      ).toBeInTheDocument(),
    );
    fireEvent.change(productorSelect, { target: { value: "20111111112" } });

    fireEvent.change(screen.getByLabelText(/camión/i), { target: { value: "AB123CD" } });
    fireEvent.change(screen.getByLabelText(/ingenio de destino/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/peso bruto/i), { target: { value: "30000" } });
    fireEvent.change(screen.getByLabelText(/tara/i), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText(/tarifa/i), { target: { value: "8000" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(createViaje).toHaveBeenCalledTimes(1));
    expect(createViaje).toHaveBeenCalledWith({
      id_viaje: "V998",
      id_finca: 1,
      producto_cuit: "20111111112",
      camion_patente: "AB123CD",
      chofer_dni: "30111222",
      id_ingenio: 1,
      num_vale: "VAL-998",
      peso_bruto_kg: 30000,
      tara_kg: 10000,
      tarifa_ton: 8000,
    });
  });
});
