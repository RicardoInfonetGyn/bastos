import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart2, Users, Lock, Clipboard, UserCheck,
  ChevronDown, ChevronRight, LogOut, MapPin, User, Shield, Menu as MenuIcon, X
} from 'lucide-react';

const Sidebar = () => {
  const { user, selectedCompany, selectedUnit, logout } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile toggle

  const toggleGroup = (groupName) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const hasPermission = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const menu = [
    {
      title: 'Principal',
      items: [{ name: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={18} /> }],
    },
    {
      title: 'Gerência',
      items: [
        { name: 'Usuários', path: '/lista-usuarios', icon: <Users size={18} /> },
        { name: 'Permissões', path: '/permissoes', icon: <Lock size={18} />, roles: ['admin'] },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        { name: 'Clientes', path: '/cadastro-cliente', icon: <Clipboard size={18} /> },
        { name: 'Funcionários', path: '/cadastro-usuario', icon: <UserCheck size={18} /> },
      ],
    },
  ];

  return (
    <>
      {/* BOTÃO FLUTUANTE MOBILE COM ANIMAÇÃO */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          md:hidden fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg transition-all duration-300
          ${sidebarOpen ? 'bg-red-600 rotate-90' : 'bg-blue-900'}
        `}
        aria-label="Abrir menu"
      >
        {sidebarOpen ? (
          <X size={24} className="text-white transition-transform duration-300" />
        ) : (
          <MenuIcon size={24} className="text-white transition-transform duration-300" />
        )}
      </button>

      {/* SIDEBAR */}
      <div
        className={`
          bg-blue-900 text-white h-full w-64 z-50
          fixed top-0 left-0 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static
        `}
      >
        {/* LOGO + EMPRESA + INFO */}
        <div className="p-4 border-b border-blue-800 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded p-1">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-lg font-semibold truncate">
              {selectedCompany?.name || 'Empresa'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <MapPin size={16} />
            <span>{selectedUnit?.name || 'Unidade'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <User size={16} />
            <span>{user?.name || user?.usrname || user?.login || 'Usuário'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Shield size={16} />
            <span>{user?.group_desc || user?.grupo || 'Grupo'}</span>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menu.map((group) => (
            <div key={group.title} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex justify-between items-center w-full px-2 py-1 text-left text-sm font-semibold text-gray-300 hover:text-white"
              >
                <span>{group.title}</span>
                {openGroups[group.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {openGroups[group.title] && (
                <ul className="mt-1 pl-2 space-y-1">
                  {group.items.map((item) =>
                    hasPermission(item) ? (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                            isActive(item.path)
                              ? 'bg-blue-700 text-white border-l-4 border-white'
                              : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                          }`}
                          onClick={() => setSidebarOpen(false)} // fecha no mobile ao navegar
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ) : null
                  )}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* BOTÃO SAIR */}
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 text-gray-300 hover:bg-blue-800 hover:text-white rounded-lg transition"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
