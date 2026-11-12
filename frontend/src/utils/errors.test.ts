import type { AxiosError } from "axios";
import { parseError } from "./errors";

function axiosError(status: number, data: unknown): AxiosError {
  return { isAxiosError: true, response: { status, data } } as unknown as AxiosError;
}

describe("parseError", () => {
  it("usa el detail string del backend (400/409)", () => {
    expect(parseError(axiosError(409, { detail: "El viaje ya existe" }))).toEqual({
      status: 409,
      message: "El viaje ya existe",
      fieldErrors: {},
    });
  });

  it("mapea errores de validación 422 por campo", () => {
    const error = axiosError(422, {
      detail: [
        { loc: ["body", "peso_bruto_kg"], msg: "Input should be greater than or equal to 0" },
        { loc: ["body", "chofer_dni"], msg: "Field required" },
      ],
    });

    expect(parseError(error)).toEqual({
      status: 422,
      message: "Revisá los datos ingresados",
      fieldErrors: {
        peso_bruto_kg: "Input should be greater than or equal to 0",
        chofer_dni: "Field required",
      },
    });
  });

  it("usa un mensaje genérico para 404 sin detail", () => {
    expect(parseError(axiosError(404, {})).message).toBe("No encontrado");
  });

  it("oculta el detalle de errores 500", () => {
    expect(parseError(axiosError(500, {})).message).toBe("Ocurrió un error inesperado");
  });

  it("avisa cuando no hay conexión con el servidor", () => {
    const error = { isAxiosError: true } as unknown as AxiosError;
    expect(parseError(error)).toEqual({
      status: null,
      message: "No se pudo conectar con el servidor",
      fieldErrors: {},
    });
  });

  it("maneja errores que no vienen de axios", () => {
    expect(parseError(new Error("boom"))).toEqual({
      status: null,
      message: "Ocurrió un error inesperado",
      fieldErrors: {},
    });
  });
});
