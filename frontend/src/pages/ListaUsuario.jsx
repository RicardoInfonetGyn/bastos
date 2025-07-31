import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNavigate } from 'react-router-dom';

const ListaUsuarios = () => {
  const { user } = useAuth();
  const { translations = {} } = useTranslation();
  const navigate = useNavigate();
  
  // ✅ Função de tradução melhorada com fallbacks
  const t = useCallback((key) => {
    if (!key) return '';
    
    // Tentar encontrar a tradução
    if (translations[key]) return translations[key];
    
    // Fallbacks em português para campos conhecidos
    const fallbacks = {
      'usuarios.titulo': 'Lista de Usuários',
      'usuarios.novo': 'Novo Usuário',
      "usuarios.novo_usuario": 'Novo Usuário',
      'usuarios.novo_cliente': 'Novo Cliente',
      'usuarios.selecione_empresa': 'Selecione a empresa',
      'usuarios.selecione_empresa_primeiro': 'Selecione empresa primeiro',
      'usuarios.selecione_unidade': 'Selecione a unidade',
      'usuarios.buscar_login': 'Buscar por login',
      'usuarios.foto': 'Foto',
      'usuarios.login': 'Login',
      'usuarios.nome': 'Nome',
      'usuarios.email': 'Email',
      'usuarios.celular': 'Celular',
      'usuarios.grupos': 'Grupos',
      'usuarios.empresas': 'Empresas',
      'usuarios.acoes': 'Ações',
      'usuarios.editar': 'Editar',
      'usuarios.excluir': 'Excluir',
      'usuarios.anterior': 'Anterior',
      'usuarios.proxima': 'Próxima',
      'usuarios.pagina': 'Página',
      'usuarios.carregando': 'Carregando...',
      'usuarios.confirmar_exclusao': 'Confirmar Exclusão',
      'usuarios.confirmar_exclusao_texto': 'Tem certeza que deseja excluir o usuário',
      'usuarios.cancelar': 'Cancelar',
      'acesso.negado': 'Acesso Negado',
      'erro.buscar_empresas': 'Erro ao buscar empresas',
      'erro.buscar_unidades': 'Erro ao buscar unidades',
      'erro.buscar_usuarios': 'Erro ao buscar usuários',
      'erro.conexao_usuarios': 'Erro de conexão ao buscar usuários',
      'erro.excluir_usuario': 'Erro ao excluir usuário',
      'erro.conexao_excluir': 'Erro de conexão ao excluir'
    };
    
    return fallbacks[key] || key;
  }, [translations]);

  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [filtros, setFiltros] = useState({
    empresa: '',
    unidade_id: '',
    login: '',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [erro, setErro] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // ✅ Funções de navegação
  const handleShowCadastroCliente = () => {
    navigate('/cadastro-cliente');
  };

  const handleShowCadastroUsuario = () => {
    navigate('/cadastro-usuario');
  };

  // ✅ Nova função para editar usuário
  const handleEditUser = (usuario) => {
    // Passa o login do usuário como parâmetro na URL
    navigate(`/editar-usuario/${usuario.login}`);
    
    // OU passar dados via state (opcional)
    // navigate('/editar-usuario', { state: { usuario } });
  };

  // ✅ Refs para controlar requisições
  const abortControllerRef = useRef(null);
  const empresasCarregadas = useRef(false);
  const timeoutRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3080';

  // ✅ Função para fazer requisições com controle de abort
  const makeRequest = useCallback(async (url, options = {}) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde um momento.');
        }
        throw new Error(`Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Requisição cancelada, não é erro
      }
      throw error;
    }
  }, []);

  // ✅ Buscar empresas com controle
  const buscarEmpresas = useCallback(async () => {
    if (empresasCarregadas.current) return;

    try {
      const data = await makeRequest(`${API_BASE}/api/empresas`);
      if (data) {
        console.log('Empresas carregadas:', data);
        setEmpresas(Array.isArray(data) ? data : []);
        empresasCarregadas.current = true;
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      setErro(error.message || t('erro.buscar_empresas'));
    }
  }, [makeRequest, API_BASE, t]);

  // ✅ Buscar unidades com debounce
  const buscarUnidades = useCallback(async (empresaId) => {
    if (!empresaId) {
      setUnidades([]);
      return;
    }

    try {
      const data = await makeRequest(`${API_BASE}/api/unidades?empresa=${empresaId}`);
      if (data) {
        console.log('Unidades carregadas:', data);
        setUnidades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      setErro(error.message || t('erro.buscar_unidades'));
    }
  }, [makeRequest, API_BASE, t]);

  // ✅ Buscar usuários com debounce
  const buscarUsuarios = useCallback(async () => {
    if (!filtros.empresa || !filtros.unidade_id) return;

    setLoading(true);
    setErro('');

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const data = await makeRequest(`${API_BASE}/api/usuarios?${queryParams}`);
      if (data) {
        setUsuarios(data.usuarios || []);
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error(t('erro.buscar_usuarios'), error);
      setErro(error.message || t('erro.conexao_usuarios'));
    } finally {
      setLoading(false);
    }
  }, [filtros, makeRequest, API_BASE, t]);

  // ✅ Effect para carregar empresas (apenas uma vez)
  useEffect(() => {
    buscarEmpresas();

    // Cleanup ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buscarEmpresas]);

  // ✅ Effect para buscar usuários com debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (filtros.empresa && filtros.unidade_id) {
        buscarUsuarios();
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filtros, buscarUsuarios]);

  // ✅ Manipular mudanças de filtro
  const handleFiltroChange = useCallback(async (e) => {
    const { name, value } = e.target;

    if (name === 'empresa') {
      setFiltros(prev => ({ 
        ...prev, 
        empresa: value, 
        unidade_id: '',
        page: 1 
      }));
      
      setUnidades([]);
      
      if (value) {
        await buscarUnidades(value);
      }
    } else {
      setFiltros(prev => ({ ...prev, [name]: value, page: 1 }));
    }
  }, [buscarUnidades]);

  const handlePageChange = useCallback((newPage) => {
    setFiltros(prev => ({ ...prev, page: newPage }));
  }, []);

  const confirmarExclusao = useCallback((usuario) => {
    setShowConfirmDelete(usuario);
  }, []);

  const excluirUsuario = useCallback(async (login) => {
    try {
      const data = await makeRequest(`${API_BASE}/api/usuarios/${login}`, {
        method: 'DELETE'
      });
      
      if (data !== null) {
        buscarUsuarios();
        setShowConfirmDelete(null);
      }
    } catch (error) {
      console.error(t('erro.excluir_usuario'), error);
      setErro(error.message || t('erro.conexao_excluir'));
    }
  }, [makeRequest, API_BASE, buscarUsuarios, t]);

  const formatarCelular = useCallback((celular) => {
    if (!celular) return '';
    const numbers = celular.replace(/\D/g, '');
    let numeroLimpo = numbers;
    if (numbers.startsWith('55') && numbers.length === 13) {
      numeroLimpo = numbers.slice(2);
    }
    if (numeroLimpo.length === 11) {
      return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
    }
    return celular;
  }, []);

  const usuarioEhAdmin = user?.priv_admin === true;

  if (!usuarioEhAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-xl text-red-600 font-bold">{t('acesso.negado')}</h2>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t('usuarios.titulo')}</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleShowCadastroCliente} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            + {t('usuarios.novo_cliente')}
          </button>
          <button 
            onClick={handleShowCadastroUsuario} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
             {t('usuarios.novo_usuario')}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          name="empresa" 
          value={filtros.empresa} 
          onChange={handleFiltroChange} 
          className="p-2 border rounded min-w-48"
        >
          <option value="">{t('usuarios.selecione_empresa')}</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.nome || emp.description || emp.name || `Empresa ${emp.id}`}
            </option>
          ))}
        </select>

        <select 
          name="unidade_id" 
          value={filtros.unidade_id} 
          onChange={handleFiltroChange} 
          className="p-2 border rounded min-w-48"
          disabled={!filtros.empresa}
        >
          <option value="">
            {!filtros.empresa 
              ? t('usuarios.selecione_empresa_primeiro') 
              : t('usuarios.selecione_unidade')
            }
          </option>
          {unidades.map(un => (
            <option key={un.id} value={un.id}>
              {un.nome || un.description || un.name || `Unidade ${un.id}`}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="login"
          value={filtros.login}
          onChange={handleFiltroChange}
          placeholder={t('usuarios.buscar_login')}
          className="p-2 border rounded w-full sm:w-64"
        />
      </div>

      {erro && (
        <div className="text-red-600 mb-2 p-2 bg-red-50 border border-red-200 rounded">
          {erro}
        </div>
      )}
      
      {loading && (
        <div className="text-gray-600 mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
          {t('usuarios.carregando')}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">{t('usuarios.foto')}</th>
              <th className="px-4 py-2 border">{t('usuarios.login')}</th>
              <th className="px-4 py-2 border">{t('usuarios.nome')}</th>
              <th className="px-4 py-2 border">{t('usuarios.email')}</th>
              <th className="px-4 py-2 border">{t('usuarios.celular')}</th>
              <th className="px-4 py-2 border">{t('usuarios.grupos')}</th>
              <th className="px-4 py-2 border">{t('usuarios.empresas')}</th>
              <th className="px-4 py-2 border">{t('usuarios.acoes')}</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.login}>
                <td className="px-4 py-2 border text-center">
                  {usuario.foto ? (
                    <img 
                      src={usuario.foto} 
                      alt="Foto" 
                      className="w-8 h-8 rounded-full object-cover mx-auto" 
                    />
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-2 border">{usuario.login}</td>
                <td className="px-4 py-2 border">{usuario.usrname}</td>
                <td className="px-4 py-2 border">{usuario.email}</td>
                <td className="px-4 py-2 border">{formatarCelular(usuario.celular)}</td>
                <td className="px-4 py-2 border">{usuario.grupos || '-'}</td>
                <td className="px-4 py-2 border">{usuario.empresas || '-'}</td>
                <td className="px-4 py-2 border">
                  <button 
                    onClick={() => handleEditUser(usuario)} 
                    className="text-blue-600 hover:underline mr-2"
                  >
                    {t('usuarios.editar')}
                  </button>
                  <button 
                    onClick={() => confirmarExclusao(usuario)} 
                    className="text-red-600 hover:underline"
                  >
                    {t('usuarios.excluir')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-4 flex gap-4 items-center">
        <button
          disabled={pagination.page <= 1}
          onClick={() => handlePageChange(filtros.page - 1)}
          className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          {t('usuarios.anterior')}
        </button>
        <span>{t('usuarios.pagina')} {pagination.page || 1}</span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => handlePageChange(filtros.page + 1)}
          className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          {t('usuarios.proxima')}
        </button>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">{t('usuarios.confirmar_exclusao')}</h3>
            <p className="mb-4">
              {t('usuarios.confirmar_exclusao_texto')} <strong>{showConfirmDelete.login}</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => excluirUsuario(showConfirmDelete.login)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                {t('usuarios.excluir')}
              </button>
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                {t('usuarios.cancelar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaUsuarios;