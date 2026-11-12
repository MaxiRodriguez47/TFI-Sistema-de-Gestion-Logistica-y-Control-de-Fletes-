import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import { homeFor, useAuth } from "../auth/useAuth";
import Layout from "../components/Layout";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import CamionesPage from "../pages/admin/CamionesPage";
import ChoferesPage from "../pages/admin/ChoferesPage";
import DashboardPage from "../pages/admin/DashboardPage";
import FincasPage from "../pages/admin/FincasPage";
import IngeniosPage from "../pages/admin/IngeniosPage";
import LocalidadesPage from "../pages/admin/LocalidadesPage";
import ProductoresPage from "../pages/admin/ProductoresPage";
import UsuariosPage from "../pages/admin/UsuariosPage";
import ViajeFormPage from "../pages/admin/ViajeFormPage";
import ViajesPage from "../pages/admin/ViajesPage";
import ChoferViajeFormPage from "../pages/chofer/ChoferViajeFormPage";
import DashboardChoferPage from "../pages/chofer/DashboardChoferPage";
import MisViajesPage from "../pages/chofer/MisViajesPage";
import PerfilPage from "../pages/chofer/PerfilPage";

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
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/viajes" element={<ViajesPage />} />
          <Route path="/admin/viajes/nuevo" element={<ViajeFormPage />} />
          <Route path="/admin/viajes/:id" element={<ViajeFormPage />} />
          <Route path="/admin/localidades" element={<LocalidadesPage />} />
          <Route path="/admin/fincas" element={<FincasPage />} />
          <Route path="/admin/productores" element={<ProductoresPage />} />
          <Route path="/admin/camiones" element={<CamionesPage />} />
          <Route path="/admin/choferes" element={<ChoferesPage />} />
          <Route path="/admin/ingenios" element={<IngeniosPage />} />
          <Route path="/admin/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rol="CHOFER" />}>
        <Route element={<Layout />}>
          <Route path="/chofer" element={<DashboardChoferPage />} />
          <Route path="/mis-viajes" element={<MisViajesPage />} />
          <Route path="/mis-viajes/nuevo" element={<ChoferViajeFormPage />} />
          <Route path="/mis-viajes/:id" element={<ChoferViajeFormPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
