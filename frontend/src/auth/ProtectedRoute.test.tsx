import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "./AuthContext";
import type { Usuario } from "../types/api";

function renderAt(path: string, user: Usuario | null) {
  const value = { user, loading: false, sessionExpired: false, signIn: async () => user!, signOut: () => {} };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login</p>} />
          <Route path="/mis-viajes" element={<p>mis viajes</p>} />
          <Route element={<ProtectedRoute rol="ADMIN" />}>
            <Route path="/admin" element={<p>admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const chofer: Usuario = { id_usuario: 2, usuario_nombre: "30111222", rol: "CHOFER", chofer_dni: "30111222", activo: true, chofer_nombre: "Gómez, Luis" };
const admin: Usuario = { id_usuario: 1, usuario_nombre: "admin", rol: "ADMIN", chofer_dni: null, activo: true, chofer_nombre: null };

describe("ProtectedRoute", () => {
  it("redirige a login sin sesión", () => {
    renderAt("/admin", null);
    expect(screen.getByText("login")).toBeInTheDocument();
  });
  it("manda al chofer a /mis-viajes si entra a /admin", () => {
    renderAt("/admin", chofer);
    expect(screen.getByText("mis viajes")).toBeInTheDocument();
  });
  it("deja pasar al admin", () => {
    renderAt("/admin", admin);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
