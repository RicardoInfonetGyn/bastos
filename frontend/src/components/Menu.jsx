import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { useAuth } from '../context/AuthContext';
import {
  Menu as MenuIcon,
  X,
  User,
  Users,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  BarChart2
} from 'lucide-react';

export default function Menu() {
  const location = useLocation();
  const { translations = {} } = useTranslation();
  const { user, selectedUnit, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showDashboardSubmenu, setShowDashboardSubmenu] = useState(false);

  const t = useCallback(
    (key) => {
      const fallbacks = {
        'menu.dashboard': 'Dashboard',
        'menu.clientRegistration': 'Cadastro Cliente',
        'menu.users': 'Usuários',
        'menu.profile': 'Meu Perfil',
        'menu.logout': 'Sair',
        'menu.roi': 'ROI'
      };
      return translations[key] || fallbacks[key] || key;
    },
    [translations]
  );

  const isActive = (path) => location.pathname === path;

  const capitalizeFirst = (str) =>
    str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {/* Botão flutuante no mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-md shadow-lg transition-all duration-300"
      >
        <MenuIcon size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-blue-900 text-white ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 z-50 flex flex-col`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3">
          {!sidebarCollapsed && <span className="text-lg font-bold">corpobueno</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* Dados do usuário */}
        {!sidebarCollapsed && showUserInfo && (
          <div className="flex items-center px-4 py-4">
            <img
              src={user?.picture || '/logo.png'}
              alt="Avatar"
              className="h-14 w-14 rounded-full object-cover border-2 border-white"
            />
            <div className="ml-3 text-left">
              <div className="text-base font-semibold">
                {capitalizeFirst(user?.usrname || user?.login)}
              </div>
              <div className="text-sm text-gray-300">
                {user?.grupo || user?.group_desc || 'Grupo'}
              </div>
              <div className="text-sm text-gray-300">
                {selectedUnit?.name || 'Unidade'}
              </div>
              <Link
                to="/meu-perfil"
                onClick={handleLinkClick}
                className="text-xs text-blue-200 hover:text-white hover:underline"
              >
                {t('menu.profile')}
              </Link>
            </div>
          </div>
        )}

        {/* Botão alternar dados usuário */}
        {!sidebarCollapsed && (
          <button
            onClick={() => setShowUserInfo(!showUserInfo)}
            className="flex items-center gap-2 px-4 py-1 text-xs text-blue-200 hover:text-white"
          >
            {showUserInfo ? <EyeOff size={16} /> : <Eye size={16} />}
            {showUserInfo ? 'Ocultar dados' : 'Mostrar dados'}
          </button>
        )}

        {/* Links de navegação */}
        <nav className="flex flex-col mt-2 space-y-1">
          <SidebarLink
            to="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label={t('menu.dashboard')}
            active={isActive('/dashboard')}
            collapsed={sidebarCollapsed}
            onClick={() => {
              setShowDashboardSubmenu(!showDashboardSubmenu);
              handleLinkClick();
            }}
            showChevron
          />
          {!sidebarCollapsed && showDashboardSubmenu && (
            <Link
              to="/dashboard/roi"
              onClick={handleLinkClick}
              className={`flex items-center gap-2 py-1.5 px-10 text-sm font-medium hover:bg-blue-700 ${
                isActive('/dashboard/roi') ? 'bg-blue-700' : ''
              }`}
            >
              <BarChart2 size={16} />
              <span>{t('menu.roi')}</span>
            </Link>
          )}
          <SidebarLink
            to="/cadastro-cliente"
            icon={<User size={18} />}
            label={t('menu.clientRegistration')}
            active={isActive('/cadastro-cliente')}
            collapsed={sidebarCollapsed}
            onClick={handleLinkClick}
          />
          <SidebarLink
            to="/lista-usuarios"
            icon={<Users size={18} />}
            label={t('menu.users')}
            active={isActive('/lista-usuarios')}
            collapsed={sidebarCollapsed}
            onClick={handleLinkClick}
          />
        </nav>

        {/* Rodapé: Sair */}
        <div className="mt-auto p-4">
          <button
            onClick={() => {
              logout();
              handleLinkClick();
            }}
            className={`w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white ${
              sidebarCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && t('menu.logout')}
          </button>
        </div>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Espaçamento lateral de acordo com colapso */}
      <div className={`${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`} />
    </>
  );
}

const SidebarLink = ({ to, label, icon, active, collapsed, onClick, showChevron }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-2 py-2 px-4 text-sm font-medium hover:bg-blue-700 ${
      active ? 'bg-blue-700' : ''
    } ${collapsed ? 'justify-center' : 'justify-start'}`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
    {!collapsed && showChevron && <ChevronRight size={14} className="ml-auto opacity-60" />}
  </Link>
);
