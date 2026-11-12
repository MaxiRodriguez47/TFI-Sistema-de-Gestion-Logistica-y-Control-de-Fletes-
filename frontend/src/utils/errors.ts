import axios from "axios";
import type { ApiErrorInfo } from "../types/api";

/** Convierte cualquier error en un formato uniforme y legible. */
export function parseError(error: unknown): ApiErrorInfo {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: "Ocurrió un error inesperado", fieldErrors: {} };
  }
  if (!error.response) {
    return { status: null, message: "No se pudo conectar con el servidor", fieldErrors: {} };
  }
  const { status, data } = error.response;
  const detail = data?.detail;
  const fieldErrors: Record<string, string> = {};
  let message: string;

  if (Array.isArray(detail)) {
    for (const item of detail) {
      const loc: (string | number)[] = item.loc ?? [];
      const field = String(loc[loc.length - 1] ?? "");
      if (field) fieldErrors[field] = item.msg;
    }
    message = "Revisá los datos ingresados";
  } else if (typeof detail === "string") {
    message = detail;
  } else if (status === 404) {
    message = "No encontrado";
  } else if (status >= 500) {
    message = "Ocurrió un error inesperado";
  } else {
    message = "Error en la solicitud";
  }
  return { status, message, fieldErrors };
}
