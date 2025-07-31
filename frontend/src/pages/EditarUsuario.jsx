import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';

const EditarUsuario = ({ userLogin, onUserSaved, onCancel }) => {
  const { translations = {} } = useTranslation();

  const t = useCallback((key) => {
    if (!key) return '';
    if (translations[key]) return translations[key];
    const fallbacks = {
      'editar.titulo': 'Editar Usuário',
      'editar.carregando': 'Carregando dados do usuário...',
      'editar.informacoes_basicas': 'Informações Básicas',
      'editar.alterar_senha': 'Alterar Senha (opcional)',
      'editar.foto_usuario': 'Foto do Usuário',
      'editar.informacoes_adicionais': 'Informações Adicionais',
      'editar.grupos_empresas': 'Grupos e Empresas',
      'editar.login': 'Login',
      'editar.nome': 'Nome',
      'editar.email': 'Email',
      'editar.celular': 'Celular',
      'editar.voltar_lista': 'Voltar para Lista',
      'editar.nova_senha': 'Nova Senha',
      'editar.confirmar_nova_senha': 'Confirmar Nova Senha',
      'editar.perfil': 'Perfil',
      'editar.nivel': 'Nível',
      'editar.unidade': 'Unidade',
      'editar.cidade': 'Cidade',
      'editar.cargo': 'Cargo',
      'editar.grupos': 'Grupos',
      'editar.empresas': 'Empresas',
      'editar.cancelar': 'Cancelar',
      'editar.atualizar': 'Atualizar Usuário',
      'editar.salvando': 'Salvando...',
      'editar.placeholder_login': 'Login',
      'editar.placeholder_nome': 'Nome completo',
      'editar.placeholder_email': 'Email',
      'editar.placeholder_celular': '(62) 99999-9999',
      'editar.placeholder_senha_atual': 'Deixe em branco para manter a atual',
      'editar.placeholder_confirmar_senha': 'Confirme a nova senha',
      'editar.placeholder_perfil': 'Perfil do usuário',
      'editar.placeholder_nivel': 'Nível',
      'editar.placeholder_unidade': 'Unidade',
      'editar.placeholder_cidade': 'Cidade',
      'editar.placeholder_cargo': 'Cargo',
      'editar.formatos_aceitos': 'Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB',
      'editar.preview': 'Preview:',
      'editar.remover_foto': 'Remover foto',
      'editar.preview_foto': 'Preview da foto',
      'editar.instrucao_grupos': 'Segure Ctrl para selecionar múltiplos grupos',
      'editar.instrucao_empresas': 'Segure Ctrl para selecionar múltiplas empresas',
      'editar.campo_obrigatorio': '*',
      'editar.sucesso': 'Usuário atualizado com sucesso!',
      'editar.sucesso_titulo': 'Sucesso!',
      'editar.fechar': 'Fechar',
      'editar.erro_carregar': 'Erro ao carregar dados do usuário',
      'editar.erro_conexao': 'Erro de conexão ao carregar usuário',
      'editar.erro_dados_iniciais': 'Erro ao buscar dados iniciais',
      'editar.erro_atualizar': 'Erro ao salvar',
      'editar.erro_atualizacao': 'Erro na atualização',
      'editar.erro_senhas_nao_coincidem': 'As senhas não coincidem',
      'editar.erro_senha_minima': 'A senha deve ter pelo menos 6 caracteres',
      'editar.erro_celular_digitos': 'Celular deve ter 11 dígitos',
      'editar.erro_arquivo_tipo': 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou GIF.',
      'editar.erro_arquivo_tamanho': 'Arquivo muito grande. Tamanho máximo: 5MB.',
      'editar.erro_ler_arquivo': 'Erro ao ler o arquivo. Tente novamente.',
      'cadastro.email_invalido': 'Email inválido'
    };
    return fallbacks[key] || key;
  }, [translations]);

  const [form, setForm] = useState({
    login: '',
    usrname: '',
    pswd: '',
    confirmPswd: '',
    email: '',
    celular: '',
    usrperfil: '',
    nivel: '',
    unidade: '',
    cidade: '',
    cargo: '',
    mfa: '',
    tema: '',
    menu: '',
    id_chat: '',
    conta: '',
    inbox: '',
    grupos: [],
    empresas: [],
    foto: '',
  });
  const [grupos, setGrupos] = useState([]);
  const [todasEmpresas, setTodasEmpresas] = useState([]);
  const [erro, setErro] = useState('');
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [errors, setErrors] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3080';

  // Função para formatar celular de volta para exibição
  const formatarCelularParaForm = useCallback((celular) => {
    if (!celular) return '';
    const numbers = celular.replace(/\D/g, '');
    
    // Remove código do país se presente
    let numeroLimpo = numbers;
    if (numbers.startsWith('55') && numbers.length === 13) {
      numeroLimpo = numbers.slice(2);
    }
    
    if (numeroLimpo.length === 11) {
      return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
    }
    return celular;
  }, []);

  // Função para aplicar máscara no celular
  const formatarCelular = useCallback((value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }, []);

  const buscarDadosIniciais = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Buscar grupos
      const resGrupos = await fetch(`${API_BASE}/api/grupos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resGrupos.ok) {
        const dataGrupos = await resGrupos.json();
        const gruposFormatados = dataGrupos.map(grupo => ({
          id: grupo.group_id,
          nome: grupo.description
        }));
        setGrupos(gruposFormatados);
      }

      // Buscar empresas
      const resEmpresas = await fetch(`${API_BASE}/api/empresas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resEmpresas.ok) {
        const dataEmpresas = await resEmpresas.json();
        const empresasFormatadas = dataEmpresas.map(empresa => ({
          id: empresa.id,
          nome: empresa.description
        }));
        setTodasEmpresas(empresasFormatadas);
      }
    } catch (error) {
      console.error(t('editar.erro_dados_iniciais'), error);
      setErro(t('editar.erro_dados_iniciais'));
    }
  }, [API_BASE, t]);

  const buscarUsuario = useCallback(async () => {
    setCarregandoDados(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/usuarios/${userLogin}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const usuario = await response.json();
        
        // Mapear dados do usuário para o formulário
        setForm({
          login: usuario.login || '',
          usrname: usuario.usrname || '',
          pswd: '', // Não carregar senha por segurança
          confirmPswd: '',
          email: usuario.email || '',
          celular: formatarCelularParaForm(usuario.celular) || '',
          usrperfil: usuario.usrperfil || '',
          nivel: usuario.nivel || '',
          unidade: usuario.unidade || '',
          cidade: usuario.cidade || '',
          cargo: usuario.cargo || '',
          mfa: usuario.mfa || '',
          tema: usuario.tema || '',
          menu: usuario.menu || '',
          id_chat: usuario.id_chat || '',
          conta: usuario.conta || '',
          inbox: usuario.inbox || '',
          grupos: usuario.grupos?.map(g => g.group_id.toString()) || [],
          empresas: usuario.empresas?.map(e => e.id.toString()) || [],
          foto: usuario.foto || '',
        });

        if (usuario.foto) {
          setPreviewFoto(usuario.foto);
        }
      } else {
        setErro(t('editar.erro_carregar'));
      }
    } catch (error) {
      console.error(t('editar.erro_conexao'), error);
      setErro(t('editar.erro_conexao'));
    } finally {
      setCarregandoDados(false);
    }
  }, [API_BASE, userLogin, t, formatarCelularParaForm]);

  // useEffect agora pode usar as funções já declaradas
  useEffect(() => {
    if (userLogin) {
      buscarDadosIniciais();
      buscarUsuario();
    }
  }, [userLogin, buscarDadosIniciais, buscarUsuario]);

  // Função para converter arquivo para base64
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setForm(prev => ({ ...prev, foto: '' }));
      setPreviewFoto(null);
      return;
    }

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      setErro(t('editar.erro_arquivo_tipo'));
      e.target.value = '';
      return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    if (file.size > tamanhoMaximo) {
      setErro(t('editar.erro_arquivo_tamanho'));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const base64 = event.target.result;
      setForm(prev => ({ ...prev, foto: base64 }));
      setPreviewFoto(base64);
    };
    
    reader.onerror = () => {
      setErro(t('editar.erro_ler_arquivo'));
    };
    
    reader.readAsDataURL(file);
  }, [t]);

  const handleChange = useCallback((e) => {
    const { name, value, selectedOptions } = e.target;
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'empresas') {
      const valores = Array.from(selectedOptions).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, [name]: valores }));
    } else if (name === 'grupos') {
      const valores = Array.from(selectedOptions).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, [name]: valores }));
    } else if (name === 'celular') {
      const valorFormatado = formatarCelular(value);
      setForm((prev) => ({ ...prev, [name]: valorFormatado }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    if (erro) setErro('');
  }, [errors, formatarCelular, erro]);

  const validarFormulario = useCallback(() => {
    const newErrors = {};
    
    // Validação das senhas (apenas se estiver alterando)
    if (form.pswd || form.confirmPswd) {
      if (form.pswd !== form.confirmPswd) {
        newErrors.confirmPswd = t('editar.erro_senhas_nao_coincidem');
      }
      
      if (form.pswd.length < 6) {
        newErrors.pswd = t('editar.erro_senha_minima');
      }
    }
    
    // Validação do celular
    if (form.celular) {
      const celularNumeros = form.celular.replace(/\D/g, '');
      if (celularNumeros.length !== 11) {
        newErrors.celular = t('editar.erro_celular_digitos');
      }
    }
    
    // Validação de email
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('cadastro.email_invalido');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setErro(Object.values(newErrors)[0]);
      return false;
    }
    
    return true;
  }, [form.pswd, form.confirmPswd, form.celular, form.email, t]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErro('');

    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        ...form,
        celular: form.celular.replace(/\D/g, ''), // Remove máscara
      };
      
      // Remove campos de confirmação
      delete payload.confirmPswd;
      
      // Se não foi digitada nova senha, não enviar
      if (!form.pswd) {
        delete payload.pswd;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/usuarios/${userLogin}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      
      if (res.ok) {
        setErrors({});
        setShowSuccessModal(true);
      } else {
        setErro(json.erro || json.mensagem || t('editar.erro_atualizar'));
      }
    } catch (error) {
      console.error(t('editar.erro_atualizar'), error);
      setErro(t('editar.erro_atualizar'));
    } finally {
      setSalvando(false);
    }
  }, [validarFormulario, form, API_BASE, userLogin, t]);

  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    onUserSaved();
  }, [onUserSaved]);

  if (carregandoDados) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('editar.carregando')}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Botão Voltar */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-blue-600 hover:underline text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('editar.voltar_lista')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            {t('editar.informacoes_basicas')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.login')} {t('editar.campo_obrigatorio')}
              </label>
              <input 
                name="login" 
                placeholder={t('editar.placeholder_login')}
                required 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.login ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.login}
                onChange={handleChange} 
              />
              {errors.login && (
                <p className="text-red-600 text-sm mt-1">{errors.login}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.nome')} {t('editar.campo_obrigatorio')}
              </label>
              <input 
                name="usrname" 
                placeholder={t('editar.placeholder_nome')}
                required 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.usrname ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.usrname}
                onChange={handleChange} 
              />
              {errors.usrname && (
                <p className="text-red-600 text-sm mt-1">{errors.usrname}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.email')} {t('editar.campo_obrigatorio')}
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder={t('editar.placeholder_email')}
                required 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.email}
                onChange={handleChange} 
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.celular')} {t('editar.campo_obrigatorio')}
              </label>
              <input 
                name="celular" 
                placeholder={t('editar.placeholder_celular')}
                required 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.celular ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.celular}
                onChange={handleChange}
                maxLength={15}
              />
              {errors.celular && (
                <p className="text-red-600 text-sm mt-1">{errors.celular}</p>
              )}
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            {t('editar.alterar_senha')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.nova_senha')}
              </label>
              <input 
                name="pswd" 
                type="password" 
                placeholder={t('editar.placeholder_senha_atual')}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pswd ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.pswd}
                onChange={handleChange} 
              />
              {errors.pswd && (
                <p className="text-red-600 text-sm mt-1">{errors.pswd}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.confirmar_nova_senha')}
              </label>
              <input 
                name="confirmPswd" 
                type="password" 
                placeholder={t('editar.placeholder_confirmar_senha')}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPswd ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.confirmPswd}
                onChange={handleChange} 
              />
              {errors.confirmPswd && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPswd}</p>
              )}
            </div>
          </div>
        </div>

        {/* Foto */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            {t('editar.foto_usuario')}
          </h3>
          <input 
            name="foto"
            type="file" 
            accept="image/*"
            className="w-full border border-gray-300 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
          />
          <small className="text-gray-500 text-xs mt-1 block">
            {t('editar.formatos_aceitos')}
          </small>
          
          {previewFoto && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.preview')}
              </label>
              <div className="flex items-center space-x-4">
                <img 
                  src={previewFoto} 
                  alt={t('editar.preview_foto')}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, foto: '' }));
                    setPreviewFoto(null);
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  {t('editar.remover_foto')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            {t('editar.informacoes_adicionais')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.perfil')}
              </label>
              <input 
                name="usrperfil" 
                placeholder={t('editar.placeholder_perfil')}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.usrperfil}
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.nivel')}
              </label>
              <input 
                name="nivel" 
                placeholder={t('editar.placeholder_nivel')}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.nivel}
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.unidade')}
              </label>
              <input 
                name="unidade" 
                placeholder={t('editar.placeholder_unidade')}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.unidade}
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.cidade')}
              </label>
              <input 
                name="cidade" 
                placeholder={t('editar.placeholder_cidade')}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.cidade}
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.cargo')}
              </label>
              <input 
                name="cargo" 
                placeholder={t('editar.placeholder_cargo')}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.cargo}
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>

        {/* Grupos e Empresas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            {t('editar.grupos_empresas')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.grupos')} {t('editar.campo_obrigatorio')}
              </label>
              <select 
                name="grupos" 
                multiple 
                required
                className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.grupos}
                onChange={handleChange}
              >
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
              <small className="text-gray-500 text-xs mt-1 block">
                {t('editar.instrucao_grupos')}
              </small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('editar.empresas')} {t('editar.campo_obrigatorio')}
              </label>
              <select 
                name="empresas" 
                multiple 
                required
                className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.empresas}
                onChange={handleChange}
              >
                {todasEmpresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
              <small className="text-gray-500 text-xs mt-1 block">
                {t('editar.instrucao_empresas')}
              </small>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6">
          <button 
            type="button"
            onClick={onCancel}
            disabled={salvando}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('editar.cancelar')}
          </button>
          <button 
            type="submit" 
            disabled={salvando}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {salvando && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {salvando ? t('editar.salvando') : t('editar.atualizar')}
          </button>
        </div>
      </form>
      
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('editar.sucesso_titulo')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('editar.sucesso')}
              </p>
              <button
                onClick={handleCloseSuccessModal}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('editar.fechar')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {erro && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-5xl mx-auto">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {erro}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarUsuario;