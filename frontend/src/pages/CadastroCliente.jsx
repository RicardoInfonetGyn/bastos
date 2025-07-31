import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CadastroCliente = () => {
  const { user, selectedCompany } = useAuth();
  const { translations = {} } = useTranslation();
  const navigate = useNavigate();

  // ✅ Função de tradução melhorada com fallbacks
  const t = useCallback((key) => {
    if (!key) return '';
    
    // Tentar encontrar a tradução
    if (translations[key]) return translations[key];
    
    // Fallbacks em português para campos conhecidos
    const fallbacks = {
      'cadastro.titulo': 'Cadastro de Cliente',
      'cadastro.nome_completo': 'Nome completo',
      'cadastro.email': 'Email',
      'cadastro.telefone': 'Telefone',
      'cadastro.data_cadastro': 'Data de Cadastro',
      'cadastro.foto': 'Foto (upload ou câmera)',
      'cadastro.upload_arquivo': 'Escolher arquivo',
      'cadastro.abrir_camera': 'Abrir câmera',
      'cadastro.tirar_foto': '📸 Tirar Foto',
      'cadastro.foto_selecionada': 'Foto selecionada',
      'cadastro.salvar': 'Salvar',
      'cadastro.mensagem': 'Mensagem',
      'cadastro.ok': 'OK',
      'cadastro.sucesso': 'Cliente salvo com sucesso!',
      'cadastro.erro_salvar': 'Erro ao salvar cliente.',
      'cadastro.erro_camera': 'Erro ao acessar a câmera',
      'cadastro.erro_envio': 'Erro ao enviar formulário',
      'cadastro.placeholder_nome': 'Digite o nome completo',
      'cadastro.placeholder_email': 'Digite o email',
      'cadastro.placeholder_telefone': 'Digite o telefone',
      'cadastro.campo_obrigatorio': 'Este campo é obrigatório',
      'cadastro.email_invalido': 'Email inválido',
      'cadastro.telefone_invalido': 'Telefone inválido',
      'cadastro.voltar_lista': 'Voltar para Lista'
    };
    
    return fallbacks[key] || key;
  }, [translations]);

  const [form, setForm] = useState({
    nome_l: '',
    nome_completo: '',
    email_l: '',
    telefone_l: '',
    data_cadastro: new Date().toISOString().split('T')[0],
    foto: ''
  });

  const [mensagem, setMensagem] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [errors, setErrors] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

  const aplicarMascaraTelefone = (valor) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const capitalizeWords = (str) =>
    str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nome_completo.trim()) {
      newErrors.nome_completo = t('cadastro.campo_obrigatorio');
    }
    
    if (!form.email_l.trim()) {
      newErrors.email_l = t('cadastro.campo_obrigatorio');
    } else if (!/\S+@\S+\.\S+/.test(form.email_l)) {
      newErrors.email_l = t('cadastro.email_invalido');
    }
    
    if (!form.telefone_l.trim()) {
      newErrors.telefone_l = t('cadastro.campo_obrigatorio');
    } else if (form.telefone_l.replace(/\D/g, '').length < 10) {
      newErrors.telefone_l = t('cadastro.telefone_invalido');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'telefone_l') {
      setForm((prev) => ({ ...prev, [name]: aplicarMascaraTelefone(value) }));
    } else if (name === 'nome_completo') {
      setForm((prev) => ({ ...prev, [name]: capitalizeWords(value) }));
    } else if (name === 'foto' && files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert(t('cadastro.erro_camera'));
    }
  };

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg');
      setForm((prev) => ({ ...prev, foto: base64 }));
      
      // Parar o stream da câmera
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const telefoneNumerico = form.telefone_l.replace(/\D/g, '');
      const ddd = telefoneNumerico.slice(0, 2);
      let numero = telefoneNumerico.slice(2);
      if (numero.length === 8) numero = '9' + numero;
      const telefoneFormatadoEnvio = `${ddd}${numero}`;

      const response = await fetch(`${API_BASE}/clientes/cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nome_l: form.nome_completo,
          nome_completo: form.nome_completo,
          email_l: form.email_l,
          telefone_l: telefoneFormatadoEnvio,
          data_cadastro: form.data_cadastro,
          empresa: selectedCompany?.id,
          login: user?.login,
          id_usuario: user?.id,
          foto: form.foto
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMensagem(data.mensagem || t('cadastro.sucesso'));
      } else {
        setMensagem(data.mensagem || t('cadastro.erro_salvar'));
      }
      
      setModalAberto(true);
    } catch (error) {
      console.error(t('cadastro.erro_envio'), error);
      setMensagem(t('cadastro.erro_salvar'));
      setModalAberto(true);
    }
  };

const fecharModal = () => {
  setModalAberto(false);

  // Rolagem suave ao topo
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Redireciona se sucesso
  if (mensagem.includes(t('cadastro.sucesso')) || mensagem.toLowerCase().includes('sucesso')) {
    setTimeout(() => {
      navigate('/lista-usuarios');
    }, 500); // espera a rolagem concluir
  }
};


  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Botão Voltar */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/lista-usuarios')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('cadastro.voltar_lista')}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {t('cadastro.titulo')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('cadastro.nome_completo')} *
          </label>
          <input 
            name="nome_completo" 
            placeholder={t('cadastro.placeholder_nome')}
            required 
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.nome_completo ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.nome_completo} 
            onChange={handleChange} 
          />
          {errors.nome_completo && (
            <p className="text-red-600 text-sm mt-1">{errors.nome_completo}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('cadastro.email')} *
          </label>
          <input 
            name="email_l" 
            type="email" 
            placeholder={t('cadastro.placeholder_email')}
            required 
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email_l ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.email_l}
            onChange={handleChange} 
          />
          {errors.email_l && (
            <p className="text-red-600 text-sm mt-1">{errors.email_l}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('cadastro.telefone')} *
          </label>
          <input 
            name="telefone_l" 
            placeholder={t('cadastro.placeholder_telefone')}
            required 
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.telefone_l ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.telefone_l} 
            onChange={handleChange} 
          />
          {errors.telefone_l && (
            <p className="text-red-600 text-sm mt-1">{errors.telefone_l}</p>
          )}
        </div>

        {/* Data de Cadastro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('cadastro.data_cadastro')}
          </label>
          <input 
            name="data_cadastro" 
            type="date" 
            value={form.data_cadastro} 
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 cursor-not-allowed" 
            readOnly 
          />
        </div>

        {/* Foto */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            {t('cadastro.foto')}
          </label>
          
          <div className="space-y-3">
            <input 
              type="file" 
              accept="image/*" 
              name="foto" 
              onChange={handleChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
            
            <button 
              type="button" 
              onClick={iniciarCamera} 
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              {t('cadastro.abrir_camera')}
            </button>
            
            <div className="flex gap-4 items-start">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-40 h-30 border border-gray-300 rounded-lg bg-gray-100" 
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <button 
                type="button" 
                onClick={tirarFoto} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t('cadastro.tirar_foto')}
              </button>
            </div>
            
            {form.foto && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">{t('cadastro.foto_selecionada')}:</p>
                <img 
                  src={form.foto} 
                  alt={t('cadastro.foto_selecionada')}
                  className="w-32 h-32 rounded-lg border border-gray-300 object-cover" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('cadastro.salvar')}
          </button>
        </div>
      </form>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {t('cadastro.mensagem')}
            </h3>
            <p className="mb-6 text-gray-700">{mensagem}</p>
            <button 
              onClick={fecharModal} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('cadastro.ok')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroCliente;