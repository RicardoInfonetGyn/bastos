import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  BrowserRouter,
  useParams,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

import LoginScreen from '../pages/LoginScreen';
import CompanySelectionScreen from '../pages/CompanySelectionScreen';
import DashboardScreen from '../pages/DashboardScreen';
import CadastroCliente from '../pages/CadastroCliente';
import CadastroUsuario from '../pages/CadastroUsuario';
import ListaUsuario from '../pages/ListaUsuario';
import EditarUsuario from '../pages/EditarUsuario';
import MeuPerfil from '../pages/MeuPerfil';
import RoiPage from '../pages/RoiPage'; // ✅ Corrigido caminho

// Wrapper para edição com navegação após salvar/cancelar
const EditarUsuarioWrapper = () => {
  const { userLogin } = useParams();
  const navigate = useNavigate();

  const handleUserSaved = () => navigate('/lista-usuarios');
  const handleCancel = () => navigate('/lista-usuarios');

  return (
    <EditarUsuario
      userLogin={userLogin}
      onUserSaved={handleUserSaved}
      onCancel={handleCancel}
    />
  );
};

const AppRoutes = () => {
  const { user, companies, selectedCompany, selectedUnit } = useAuth();

  if (user === undefined || companies === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  if (
    Array.isArray(companies) &&
    companies.length > 0 &&
    (!selectedCompany || !selectedUnit)
  ) {
    return <CompanySelectionScreen />;
  }

  return (
    <Routes>
      {/* Páginas com menu/layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/dashboard/roi" element={<RoiPage />} />
        <Route path="/cadastro-cliente" element={<CadastroCliente />} />
        <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
        <Route path="/lista-usuarios" element={<ListaUsuario />} />
        <Route path="/editar-usuario" element={<EditarUsuario />} />
        <Route path="/editar-usuario/:userLogin" element={<EditarUsuarioWrapper />} />
        <Route path="/meu-perfil" element={<MeuPerfil />} />
      </Route>

      {/* Rota fallback */}
      <Route path="*" element={<div className="p-6 text-danger">Página não encontrada</div>} />
    </Routes>
  );
};

export default function AppRoutesWithRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
