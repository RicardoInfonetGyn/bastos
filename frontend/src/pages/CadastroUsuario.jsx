import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CadastroUsuario = () => {
  const { user, selectedCompany } = useAuth();
  const { translations = {} } = useTranslation();
  const navigate = useNavigate();
  
  console.log('useAuth retorno:', { user, selectedCompany }); // Debug
  
  // ✅ Função de tradução melhorada com fallbacks
  const t = useCallback((key) => {
    if (!key) return '';
    
    // Tentar encontrar a tradução
    if (translations[key]) return translations[key];
    
    // Fallbacks em português para campos conhecidos
    const fallbacks = {
      'usuario.titulo': 'Cadastro de Usuário',
      'usuario.login': 'Login',
      'usuario.nome': 'Nome',
      'usuario.senha': 'Senha',
      'usuario.repetir_senha': 'Repetir Senha',
      'usuario.email': 'Email',
      'usuario.celular': 'Celular',
      'usuario.foto': 'Foto do Usuário',
      'usuario.grupo': 'Grupo',
      'usuario.empresas': 'Empresas (Multi-seleção)',
      'usuario.salvar': 'Salvar Usuário',
      'usuario.placeholder_login': 'Digite o login',
      'usuario.placeholder_nome': 'Digite o nome completo',
      'usuario.placeholder_senha': 'Digite a senha',
      'usuario.placeholder_repetir_senha': 'Repita a senha',
      'usuario.placeholder_email': 'Digite o email',
      'usuario.placeholder_celular': '(62) 99999-9999',
      'usuario.selecione_grupo': 'Selecione um grupo',
      'usuario.carregando_grupos': 'Carregando grupos...',
      'usuario.carregando_empresas': 'Carregando empresas...',
      'usuario.aguarde_carregamento': 'Aguarde o carregamento...',
      'usuario.multi_selecao_instrucao': 'Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplas empresas',
      'usuario.formatos_aceitos': 'Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB',
      'usuario.preview': 'Preview:',
      'usuario.remover_foto': 'Remover foto',
      'usuario.preview_foto': 'Preview da foto',
      'usuario.sucesso': 'Usuário cadastrado com sucesso!',
      'usuario.erro_senhas_nao_coincidem': 'As senhas não coincidem',
      'usuario.erro_senha_minima': 'A senha deve ter pelo menos 6 caracteres',
      'usuario.erro_celular_digitos': 'Celular deve ter 11 dígitos',
      'usuario.erro_arquivo_tipo': 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou GIF.',
      'usuario.erro_arquivo_tamanho': 'Arquivo muito grande. Tamanho máximo: 5MB.',
      'usuario.erro_ler_arquivo': 'Erro ao ler o arquivo. Tente novamente.',
      'usuario.erro_token_nao_encontrado': 'Token de autenticação não encontrado',
      'usuario.erro_buscar_grupos': 'Erro ao buscar grupos',
      'usuario.erro_buscar_empresas': 'Erro ao buscar empresas',
      'usuario.erro_conexao_grupos': 'Erro de conexão ao buscar grupos',
      'usuario.erro_conexao_empresas': 'Erro de conexão ao buscar empresas',
      'usuario.erro_resposta_grupos': 'Erro: Resposta inesperada do servidor para grupos',
      'usuario.erro_resposta_empresas': 'Erro: Resposta inesperada do servidor para empresas',
      'usuario.erro_cadastro': 'Erro no cadastro',
      'usuario.erro_cadastrar': 'Erro ao cadastrar usuário',
      'usuario.nenhum_grupo_encontrado': 'Nenhum grupo encontrado. Verifique as permissões.',
      'usuario.nenhuma_empresa_encontrada': 'Nenhuma empresa encontrada. Verifique as permissões.',
      'usuario.campo_obrigatorio': '*',
      'usuario.voltar_lista': 'Voltar para Lista',
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
    empresa: selectedCompany?.id || '',
    grupo: '',
    empresas: [],
    foto: '', // base64 da foto
  });
  const [grupos, setGrupos] = useState([]);
  const [todasEmpresas, setTodasEmpresas] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [errors, setErrors] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3080';

  useEffect(() => {
    const buscarDados = async () => {
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', !!token);
      console.log('API_BASE:', API_BASE);
      console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL);
      
      // Verificar se o token existe
      if (!token) {
        console.error('Token não encontrado');
        setErro(t('usuario.erro_token_nao_encontrado'));
        setCarregandoDados(false);
        return;
      }
      
      setCarregandoDados(true);

      // Buscar grupos
      try {
        console.log('Fazendo requisição para grupos:', `${API_BASE}/api/grupos`);
        const resGrupos = await fetch(`${API_BASE}/api/grupos`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('Status resposta grupos:', resGrupos.status);
        console.log('Headers resposta grupos:', resGrupos.headers.get('content-type'));
        
        if (resGrupos.ok) {
          const contentType = resGrupos.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const dataGrupos = await resGrupos.json();
            console.log('Dados grupos recebidos:', dataGrupos);
            // Mapear para o formato esperado pelo frontend
            const gruposFormatados = dataGrupos.map(grupo => ({
              id: grupo.group_id,
              nome: grupo.description
            }));
            setGrupos(gruposFormatados);
          } else {
            console.error('Resposta não é JSON para grupos:', await resGrupos.text());
            setErro(t('usuario.erro_resposta_grupos'));
          }
        } else {
          console.error('Erro na resposta grupos:', resGrupos.statusText);
          const errorText = await resGrupos.text();
          console.error('Texto do erro grupos:', errorText);
          setErro(`${t('usuario.erro_buscar_grupos')}: ${resGrupos.status}`);
        }
      } catch (err) {
        console.error('Erro ao buscar grupos:', err);
        setErro(t('usuario.erro_conexao_grupos'));
      }

      // Buscar empresas
      try {
        console.log('Fazendo requisição para empresas:', `${API_BASE}/api/empresas`);
        const resEmpresas = await fetch(`${API_BASE}/api/empresas`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('Status resposta empresas:', resEmpresas.status);
        console.log('Headers resposta empresas:', resEmpresas.headers.get('content-type'));
        
        if (resEmpresas.ok) {
          const contentType = resEmpresas.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const dataEmpresas = await resEmpresas.json();
            console.log('Dados empresas recebidos:', dataEmpresas);
            // Mapear para o formato esperado pelo frontend
            const empresasFormatadas = dataEmpresas.map(empresa => ({
              id: empresa.id,
              nome: empresa.description
            }));
            setTodasEmpresas(empresasFormatadas);
          } else {
            console.error('Resposta não é JSON para empresas:', await resEmpresas.text());
            setErro(t('usuario.erro_resposta_empresas'));
          }
        } else {
          console.error('Erro na resposta empresas:', resEmpresas.statusText);
          const errorText = await resEmpresas.text();
          console.error('Texto do erro empresas:', errorText);
          setErro(`${t('usuario.erro_buscar_empresas')}: ${resEmpresas.status}`);
        }
      } catch (err) {
        console.error('Erro ao buscar empresas:', err);
        setErro(t('usuario.erro_conexao_empresas'));
      }
      
      setCarregandoDados(false);
    };

    buscarDados();
  }, [t, API_BASE]); // ✅ Adicionado API_BASE nas dependências

  // Função para converter arquivo para base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setForm(prev => ({ ...prev, foto: '' }));
      setPreviewFoto(null);
      return;
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      setErro(t('usuario.erro_arquivo_tipo'));
      e.target.value = '';
      return;
    }

    // Validar tamanho (máximo 5MB)
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    if (file.size > tamanhoMaximo) {
      setErro(t('usuario.erro_arquivo_tamanho'));
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
      setErro(t('usuario.erro_ler_arquivo'));
    };
    
    reader.readAsDataURL(file);
  };

  // Função para aplicar máscara no celular
  const formatarCelular = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (62) 99999-9999
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'empresas') {
      const valores = Array.from(selectedOptions).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, [name]: valores }));
    } else if (name === 'celular') {
      // Aplica a máscara no celular
      const valorFormatado = formatarCelular(value);
      setForm((prev) => ({ ...prev, [name]: valorFormatado }));
    } else if (name === 'foto') {
      // Não fazer nada aqui, será tratado por handleFileChange
      return;
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    // Limpa mensagens de erro ao digitar
    if (erro) setErro('');
  };

  const validarFormulario = () => {
    const newErrors = {};
    
    // Validação das senhas
    if (form.pswd !== form.confirmPswd) {
      newErrors.confirmPswd = t('usuario.erro_senhas_nao_coincidem');
    }
    
    if (form.pswd.length < 6) {
      newErrors.pswd = t('usuario.erro_senha_minima');
    }
    
    // Validação do celular (deve ter 11 dígitos)
    const celularNumeros = form.celular.replace(/\D/g, '');
    if (celularNumeros.length !== 11) {
      newErrors.celular = t('usuario.erro_celular_digitos');
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (!validarFormulario()) {
      return;
    }

    try {
      const payload = {
        ...form,
        grupos: [form.grupo], // único grupo em array
        celular: form.celular.replace(/\D/g, ''), // Remove máscara para enviar
      };
      
      // Remove o campo confirmPswd do payload
      delete payload.confirmPswd;

      const res = await fetch(`${API_BASE}/api/usuarios/cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      
      if (res.ok) {
        setMensagem(json.mensagem || t('usuario.sucesso'));
        // Limpa o formulário
        setForm({
          login: '',
          usrname: '',
          pswd: '',
          confirmPswd: '',
          email: '',
          celular: '',
          empresa: selectedCompany?.id || '',
          grupo: '',
          empresas: [],
          foto: '',
        });
        setPreviewFoto(null);
        setErrors({});
        // Limpar o input file
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setErro(json.mensagem || t('usuario.erro_cadastro'));
      }
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setErro(t('usuario.erro_cadastrar'));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Botão Voltar */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/lista-usuarios')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('usuario.voltar_lista')}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {t('usuario.titulo')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.login')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="login" 
              placeholder={t('usuario.placeholder_login')}
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
          
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.nome')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="usrname" 
              placeholder={t('usuario.placeholder_nome')}
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
          
          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.senha')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="pswd" 
              type="password" 
              placeholder={t('usuario.placeholder_senha')}
              required 
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
          
          {/* Repetir Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.repetir_senha')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="confirmPswd" 
              type="password" 
              placeholder={t('usuario.placeholder_repetir_senha')}
              required 
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
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.email')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="email" 
              type="email" 
              placeholder={t('usuario.placeholder_email')}
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
          
          {/* Celular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('usuario.celular')} {t('usuario.campo_obrigatorio')}
            </label>
            <input 
              name="celular" 
              placeholder={t('usuario.placeholder_celular')}
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

        {/* Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('usuario.foto')}
          </label>
          <input 
            name="foto"
            type="file" 
            accept="image/*"
            className="w-full border border-gray-300 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
          />
          <small className="text-gray-500 text-xs mt-1 block">
            {t('usuario.formatos_aceitos')}
          </small>
          
          {previewFoto && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('usuario.preview')}
              </label>
              <div className="flex items-center space-x-4">
                <img 
                  src={previewFoto} 
                  alt={t('usuario.preview_foto')}
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
                  {t('usuario.remover_foto')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grupo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('usuario.grupo')} {t('usuario.campo_obrigatorio')}
          </label>
          <select 
            name="grupo" 
            required 
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.grupo ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.grupo}
            onChange={handleChange}
            disabled={carregandoDados}
          >
            <option value="">
              {carregandoDados ? t('usuario.carregando_grupos') : t('usuario.selecione_grupo')}
            </option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
          {!carregandoDados && grupos.length === 0 && (
            <small className="text-red-500 text-xs mt-1 block">
              {t('usuario.nenhum_grupo_encontrado')}
            </small>
          )}
          {errors.grupo && (
            <p className="text-red-600 text-sm mt-1">{errors.grupo}</p>
          )}
        </div>

        {/* Empresas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('usuario.empresas')}
          </label>
          <select 
            name="empresas" 
            multiple 
            className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.empresas}
            onChange={handleChange}
            disabled={carregandoDados}
          >
            {carregandoDados ? (
              <option disabled>{t('usuario.carregando_empresas')}</option>
            ) : (
              todasEmpresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))
            )}
          </select>
          <small className="text-gray-500 text-xs mt-1 block">
            {carregandoDados 
              ? t('usuario.aguarde_carregamento')
              : t('usuario.multi_selecao_instrucao')
            }
          </small>
          {!carregandoDados && todasEmpresas.length === 0 && (
            <small className="text-red-500 text-xs mt-1 block">
              {t('usuario.nenhuma_empresa_encontrada')}
            </small>
          )}
        </div>

        {/* Botão Salvar */}
        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('usuario.salvar')}
          </button>
        </div>
      </form>
      
      {erro && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {erro}
        </div>
      )}
      
      {mensagem && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {mensagem}
        </div>
      )}
    </div>
  );
};

export default CadastroUsuario;