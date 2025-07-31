import React, { useState, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import ListaUsuarios from './ListaUsuarios';
import CadastroUsuario from './CadastroUsuario';
import EditarUsuario from './EditarUsuario';
import { ArrowLeft } from 'lucide-react';

const UsuariosManager = () => {
  const { translations = {} } = useTranslation();
  
  // ✅ Função de tradução melhorada com fallbacks
  const t = useCallback((key) => {
    if (!key) return '';
    
    // Tentar encontrar a tradução
    if (translations[key]) return translations[key];
    
    // Fallbacks em português para campos conhecidos
    const fallbacks = {
      'manager.voltar_lista': 'Voltar para Lista',
      'manager.cadastro_usuario': 'Cadastro de Usuário',
      'manager.editar_usuario': 'Editar Usuário',
      'manager.separador': '|',
      'manager.usuario_salvo': 'Usuário salvo com sucesso',
      'manager.confirmar_voltar': 'Deseja sair sem salvar as alterações?',
      'manager.alteracoes_perdidas': 'Todas as alterações não salvas serão perdidas.',
      'manager.sim_voltar': 'Sim, voltar',
      'manager.continuar_editando': 'Continuar editando'
    };
    
    return fallbacks[key] || key;
  }, [translations]);

  const [currentView, setCurrentView] = useState('lista'); // 'lista', 'cadastro', 'editar'
  const [selectedUserLogin, setSelectedUserLogin] = useState(null);

  const handleShowCadastro = useCallback(() => {
    setCurrentView('cadastro');
    setSelectedUserLogin(null);
  }, []);

  const handleShowLista = useCallback(() => {
    setCurrentView('lista');
    setSelectedUserLogin(null);
  }, []);

  const handleEditUser = useCallback((userLogin) => {
    setSelectedUserLogin(userLogin);
    setCurrentView('editar');
  }, []);

  const handleUserSaved = useCallback(() => {
    // Voltar para a lista após salvar
    setCurrentView('lista');
    setSelectedUserLogin(null);
  }, []);

  const handleBackWithConfirmation = useCallback(() => {
    // Em uma implementação mais robusta, você pode verificar se há alterações não salvas
    // e mostrar um modal de confirmação
    handleShowLista();
  }, [handleShowLista]);

  // Componente para o cabeçalho com navegação
  const NavigationHeader = ({ title, onBack }) => (
    <div className="p-6 bg-white border-b shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{t('manager.voltar_lista')}</span>
        </button>
        <div className="text-gray-300 font-light">{t('manager.separador')}</div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'lista' && (
        <ListaUsuarios
          onEditUser={handleEditUser}
          onShowCadastro={handleShowCadastro}
        />
      )}
      
      {currentView === 'cadastro' && (
        <div className="min-h-screen bg-gray-50">
          <NavigationHeader 
            title={t('manager.cadastro_usuario')}
            onBack={handleBackWithConfirmation}
          />
          <div className="bg-gray-50">
            <CadastroUsuario onUserSaved={handleUserSaved} />
          </div>
        </div>
      )}
      
      {currentView === 'editar' && selectedUserLogin && (
        <div className="min-h-screen bg-gray-50">
          <NavigationHeader 
            title={t('manager.editar_usuario')}
            onBack={handleBackWithConfirmation}
          />
          <div className="bg-gray-50">
            <EditarUsuario 
              userLogin={selectedUserLogin}
              onUserSaved={handleUserSaved}
              onCancel={handleShowLista}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosManager;