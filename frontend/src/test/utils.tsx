import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import type { Usuario, Viaje } from "../types/api";

export const adminUser: Usuario = {
  id_usuario: 1,
  usuario_nombre: "admin",
  rol: "ADMIN",
  chofer_dni: null,
  activo: true,
  chofer_nombre: null,
};

export const choferUser: Usuario = {
  id_usuario: 2,
  usuario_nombre: "30111222",
  rol: "CHOFER",
  chofer_dni: "30111222",
  activo: true,
  chofer_nombre: "Gómez, Luis",
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  route?: string;
  user?: Usuario | null;
  queryClient?: QueryClient;
}

/** Renderiza con QueryClient, router y contexto de sesión listos para probar páginas. */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = "/", user = adminUser, queryClient = createTestQueryClient() } = options;

  const authValue = {
    user,
    loading: false,
    sessionExpired: false,
    signIn: async () => user as Usuario,
    signOut: () => {},
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}

let viajeSeq = 0;

/** Factory de viajes con valores coherentes entre bruto, tara, neto y flete. */
export function makeViaje(overrides: Partial<Viaje> = {}): Viaje {
  const n = ++viajeSeq;
  const id = overrides.id_viaje ?? `V${String(n).padStart(3, "0")}`;
  const bruto = overrides.peso_bruto_kg ?? 30000;
  const tara = overrides.tara_kg ?? 10000;
  const tarifa = overrides.tarifa_ton ?? 8000;
  const neto = overrides.peso_neto_kg ?? bruto - tara;
  const flete = overrides.flete ?? Math.round((neto / 1000) * tarifa * 100) / 100;
  const choferDni = overrides.chofer_dni ?? "30111222";

  return {
    id_viaje: id,
    id_finca: 1,
    producto_cuit: "20111111112",
    camion_patente: "AB123CD",
    chofer_dni: choferDni,
    id_ingenio: 1,
    num_vale: `VAL-${String(n).padStart(3, "0")}`,
    peso_bruto_kg: bruto,
    tara_kg: tara,
    tarifa_ton: tarifa,
    peso_neto_kg: neto,
    flete,
    finca: { id_finca: 1, finca_nombre: "La Esperanza" },
    producto: { producto_cuit: "20111111112", producto_nombre: "Pérez, Juan" },
    camion: { camion_patente: "AB123CD" },
    chofer: { chofer_dni: choferDni, chofer_nombre: "Gómez, Luis" },
    ingenio: { id_ingenio: 1, ingenio_nombre: "Ingenio Central" },
    ...overrides,
  };
}
