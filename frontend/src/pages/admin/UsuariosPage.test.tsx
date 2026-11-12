import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsuariosPage from "./UsuariosPage";
import { createUsuario, listUsuarios } from "../../api/usuarios";
import { listChoferes } from "../../api/choferes";
import { adminUser, choferUser, renderWithProviders } from "../../test/utils";

vi.mock("../../api/usuarios", () => ({
  listUsuarios: vi.fn(),
  createUsuario: vi.fn(),
  updateUsuario: vi.fn(),
}));
vi.mock("../../api/choferes", () => ({ listChoferes: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listUsuarios).mockResolvedValue([adminUser, choferUser]);
  vi.mocked(listChoferes).mockResolvedValue([
    { chofer_dni: "28444555", chofer_nombre: "Pérez, Ana", telefonos: [] },
  ]);
});

describe("UsuariosPage", () => {
  it("no permite desactivar la cuenta propia", async () => {
    renderWithProviders(<UsuariosPage />, { user: adminUser });

    const fila = (await screen.findByText("admin")).closest("tr");
    if (!fila) throw new Error("No se encontró la fila del usuario admin");
    fireEvent.click(within(fila).getByRole("button", { name: "Editar" }));

    const dialog = await screen.findByRole("dialog", { name: "Editar usuario" });
    expect(within(dialog).getByRole("checkbox", { name: /cuenta activa/i })).toBeDisabled();
    expect(within(dialog).getByText("No podés desactivar tu propia cuenta.")).toBeInTheDocument();
  });

  it("permite desactivar la cuenta de otro usuario", async () => {
    renderWithProviders(<UsuariosPage />, { user: adminUser });

    const fila = (await screen.findByText("30111222")).closest("tr");
    if (!fila) throw new Error("No se encontró la fila del chofer");
    fireEvent.click(within(fila).getByRole("button", { name: "Editar" }));

    const dialog = await screen.findByRole("dialog", { name: "Editar usuario" });
    expect(within(dialog).getByRole("checkbox", { name: /cuenta activa/i })).toBeEnabled();
    expect(
      within(dialog).getByText("Desmarcar esta opción da de baja la cuenta (no se elimina)."),
    ).toBeInTheDocument();
  });

  it("valida los datos antes de crear un usuario", async () => {
    renderWithProviders(<UsuariosPage />, { user: adminUser });

    fireEvent.click(await screen.findByRole("button", { name: "Nuevo usuario" }));

    const dialog = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Crear usuario" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Revisá los datos ingresados");
    expect(
      within(dialog).getByText("El usuario debe tener entre 3 y 50 caracteres"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("La contraseña debe tener entre 8 y 128 caracteres"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Seleccioná el chofer que usará esta cuenta"),
    ).toBeInTheDocument();
    expect(createUsuario).not.toHaveBeenCalled();
  });
});
