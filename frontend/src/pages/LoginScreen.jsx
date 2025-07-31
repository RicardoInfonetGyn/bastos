import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';

const bandeiras = {
  'pt-BR': 'https://flagcdn.com/w40/br.png',
  'en-US': 'https://flagcdn.com/w40/us.png',
  'es-ES': 'https://flagcdn.com/w40/es.png',
  'fr-FR': 'https://flagcdn.com/w40/fr.png'
};

const LoginScreen = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ login: '', password: '', idioma: 'pt-BR' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const [idiomasDisponiveis, setIdiomasDisponiveis] = useState([]);

  useEffect(() => {
    const fetchIdiomas = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/i18n/idiomas`);
        setIdiomasDisponiveis(Array.isArray(data) ? data : []);
      } catch {
        setIdiomasDisponiveis([]);
      }
    };
    fetchIdiomas();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(formData.idioma);
  }, [formData.idioma]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.login) newErrors.login = t('errors.requiredLogin');
    if (!formData.password) newErrors.password = t('errors.requiredPassword');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const idiomaBackend = formData.idioma;
    try {
      await login({ ...formData, idioma: idiomaBackend });
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-100 p-4 bg-cover bg-center" style={{ backgroundImage: 'url("/fundo.jpg")' }}>
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-6 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-20 w-20 object-contain rounded-full shadow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('login.welcome')}</h1>
          <p className="text-gray-600">{t('login.subtext')}</p>
        </div>

        {errors.general && (
          <div className="bg-red-100 text-red-800 p-2 rounded flex items-center space-x-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.language')}</label>
            <select name="idioma" value={formData.idioma} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
              {idiomasDisponiveis.map((idioma) => (
                <option key={idioma.codigo} value={idioma.codigo}>{idioma.nome}</option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2">
              <img src={bandeiras[formData.idioma]} alt="Bandeira" className="w-6 h-4 object-cover rounded shadow" />
              <span className="text-sm text-gray-600">{formData.idioma}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.user')}</label>
            <input name="login" value={formData.login} onChange={handleChange} placeholder={t('login.userPlaceholder')} disabled={loading} className={`w-full px-4 py-2 border rounded-lg ${errors.login ? 'border-red-500' : ''}`} />
            {errors.login && <p className="text-red-600 text-sm mt-1">{errors.login}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder={t('login.passwordPlaceholder')} disabled={loading} className={`w-full px-4 py-2 border rounded-lg ${errors.password ? 'border-red-500' : ''}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 text-gray-400">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('login.loggingIn')}</span>
            </div>
          ) : (
            t('login.enter')
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
