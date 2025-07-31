import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { User, Building2, MapPin, LogOut, Home } from 'lucide-react';

const DashboardScreen = () => {
  const { user, selectedCompany, selectedUnit, logout } = useAuth();
  const { translations = {} } = useTranslation();
  const [cliente, setCliente] = useState(null);
  const [clienteLabels, setClienteLabels] = useState({});

  const t = useCallback((key) => {
    if (!key) return '';
    if (translations[key]) return translations[key];

    const fallbacks = {
      'dashboard.titulo': 'Dashboard',
      'dashboard.sair': 'Sair',
      'dashboard.confirmar_sair': 'Deseja realmente sair?',
      'dashboard.usuario': 'Usuário',
      'dashboard.empresa': 'Empresa',
      'dashboard.unidade': 'Unidade',
      'dashboard.cliente': 'Cliente',
      'dashboard.informacoes': 'Informações',
      'dashboard.nome': 'Nome',
      'dashboard.login': 'Login',
      'dashboard.email': 'Email',
      'dashboard.grupo': 'Grupo',
      'dashboard.administrador': 'Administrador',
      'dashboard.id': 'ID',
      'dashboard.telefone': 'Telefone',
      'dashboard.na': 'N/A',
      'erro.buscar_cliente': 'Erro ao buscar dados do cliente',
      'aviso.sem_user_login': 'Nenhum user.login encontrado'
    };

    return fallbacks[key] || key;
  }, [translations]);

  const handleLogout = async () => {
    if (window.confirm(t('dashboard.confirmar_sair'))) {
      await logout();
    }
  };

  useEffect(() => {
    const fetchCliente = async () => {
      if (!user?.login) {
        console.warn('⚠️', t('aviso.sem_user_login'));
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clientes/dados-usuario/${user.login}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        console.log('📥 Dados do cliente:', data);
        setCliente(data.dados);
        setClienteLabels(data.labels || {});
      } catch (error) {
        console.error('❌', t('erro.buscar_cliente'), error);
      }
    };

    fetchCliente();
  }, [user, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t('dashboard.titulo')}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedCompany?.name} - {selectedUnit?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="inline-block mr-1" />
            {t('dashboard.sair')}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Usuário */}
          <Card
            icon={
              user?.picture
                ? <img src={user.picture} alt="Foto" className="rounded-full h-10 w-10 object-cover" />
                : <User className="h-6 w-6 text-blue-600" />
            }
            title={t('dashboard.usuario')}
            subtitle={t('dashboard.informacoes')}
            content={[
              { label: t('dashboard.nome'), value: user?.name },
              { label: t('dashboard.login'), value: user?.login },
              { label: t('dashboard.email'), value: user?.email },
              { label: t('dashboard.grupo'), value: user?.group_desc },
              {
                label: t('dashboard.administrador'),
                value: user?.priv_admin ? t('dashboard.sim') : t('dashboard.nao')
              },
            ]}
            t={t}
          />

          {/* Empresa */}
          <Card
            icon={<Building2 className="h-6 w-6 text-green-600" />}
            title={t('dashboard.empresa')}
            subtitle={t('dashboard.informacoes')}
            content={[
              { label: t('dashboard.nome'), value: selectedCompany?.name },
              { label: t('dashboard.id'), value: selectedCompany?.id },
            ]}
            t={t}
          />

          {/* Unidade */}
          <Card
            icon={<MapPin className="h-6 w-6 text-purple-600" />}
            title={t('dashboard.unidade')}
            subtitle={t('dashboard.informacoes')}
            content={[
              { label: t('dashboard.nome'), value: selectedUnit?.name },
              { label: t('dashboard.id'), value: selectedUnit?.id },
            ]}
            t={t}
          />

          {/* Cliente dinâmico */}
{cliente && (
  <Card
    icon={
      cliente.picture
        ? <img src={cliente.picture} alt="Foto Cliente" className="rounded-full h-10 w-10 object-cover" />
        : <User className="h-6 w-6 text-blue-600" />
    }
    title={clienteLabels.titulo || t('dashboard.cliente')}
    subtitle={t('dashboard.informacoes')}
    content={Object.entries(cliente)
      .filter(([key]) => key !== 'picture') // remove a imagem da listagem textual
      .map(([key, value]) => ({
        label: clienteLabels[key] || key,
        value: value
      }))
    }
    t={t}
  />
)}

        </div>
      </main>
    </div>
  );
};

// Card comum (usado para usuário, empresa e unidade)
const Card = ({ icon, title, subtitle, content, t }) => (
  <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-3">
      {content.map(({ label, value }, index) => (
        <div key={label || index} className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <p className="text-gray-900 mt-1">{value || t('dashboard.na')}</p>
        </div>
      ))}
    </div>
  </div>
);

// Novo CardDinamico para dados/labels automáticos
const CardDinamico = ({ icon, title, subtitle, dados = {}, labels = {}, t }) => (
  <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-3">
{Object.entries(dados).map(([key, value]) => {
  if (key === 'picture') return null; // Oculta o campo picture
  return (
    <div key={key} className="flex flex-col">
      <span className="text-sm font-medium text-gray-500">{labels[key] || key}</span>
      <p className="text-gray-900 mt-1">{value || t('dashboard.na')}</p>
    </div>
  );
})}

    </div>
  </div>
);

export default DashboardScreen;
