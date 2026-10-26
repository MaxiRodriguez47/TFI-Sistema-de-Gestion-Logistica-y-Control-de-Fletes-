import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import { homeFor, useAuth } from "../auth/useAuth";
import Layout from "../components/Layout";
import Placeholder from "../components/Placeholder";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import LocalidadesPage from "../pages/admin/LocalidadesPage";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homeFor(user.rol) : "/login"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<ProtectedRoute rol="ADMIN" />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Placeholder title="Dashboard" />} />
          <Route path="/admin/viajes" element={<Placeholder title="Viajes" />} />
          <Route path="/admin/localidades" element={<LocalidadesPage />} />
          <Route path="/admin/fincas" element={<Placeholder title="Fincas" />} />
          <Route path="/admin/productores" element={<Placeholder title="Productores" />} />
          <Route path="/admin/camiones" element={<Placeholder title="Camiones" />} />
          <Route path="/admin/choferes" element={<Placeholder title="Choferes" />} />
          <Route path="/admin/ingenios" element={<Placeholder title="Ingenios" />} />
          <Route path="/admin/usuarios" element={<Placeholder title="Usuarios" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rol="CHOFER" />}>
        <Route element={<Layout />}>
          <Route path="/mis-viajes" element={<Placeholder title="Mis viajes" />} />
          <Route path="/mis-viajes/nuevo" element={<Placeholder title="Nuevo viaje" />} />
          <Route path="/perfil" element={<Placeholder title="Mi perfil" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
