import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { User, Lock, Mail, Save, Image } from 'lucide-react';

const MeuPerfil = () => {
  const { user, selectedCompany, selectedUnit } = useAuth();
  const { translations = {} } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    picture: ''
  });

  const [preview, setPreview] = useState('');

  const t = useCallback((key) => {
    const fallback = {
      'meuperfil.titulo': 'Meu Perfil',
      'meuperfil.nome': 'Nome',
      'meuperfil.email': 'Email',
      'meuperfil.senha': 'Nova Senha (opcional)',
      'meuperfil.salvar': 'Salvar alterações',
      'meuperfil.empresa': 'Empresa',
      'meuperfil.unidade': 'Unidade',
      'meuperfil.grupo': 'Grupo',
      'meuperfil.foto': 'Foto do Usuário',
    };
    return translations[key] || fallback[key] || key;
  }, [translations]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        picture: user.picture || ''
      });
      setPreview(user.picture || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'picture' && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setForm({ ...form, picture: reader.result });
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Enviando perfil atualizado:', form);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/meu-perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.sucesso) {
        alert('✅ Perfil atualizado com sucesso!');
      } else {
        alert('❌ Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil', error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl mt-6">
      <h1 className="text-2xl font-bold mb-4">{t('meuperfil.titulo')}</h1>

      {/* Foto */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative mb-2">
          <img
            src={preview || '/logo.png'}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
          />
        </div>
        <label className="text-sm text-gray-700">{t('meuperfil.foto')}</label>
        <input
          type="file"
          accept="image/*"
          name="picture"
          onChange={handleChange}
          className="mt-1 text-sm"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('meuperfil.nome')}</label>
          <div className="flex items-center border rounded px-2">
            <User className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">{t('meuperfil.email')}</label>
          <div className="flex items-center border rounded px-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">{t('meuperfil.senha')}</label>
          <div className="flex items-center border rounded px-2">
            <Lock className="h-4 w-4 text-gray-400" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>

        {/* Dados informativos */}
        <div className="text-sm text-gray-500 border-t pt-4 mt-4 space-y-1">
          <div>
            <strong>{t('meuperfil.empresa')}:</strong> {selectedCompany?.name}
          </div>
          <div>
            <strong>{t('meuperfil.unidade')}:</strong> {selectedUnit?.name}
          </div>
          <div>
            <strong>{t('meuperfil.grupo')}:</strong> {user?.group_desc || user?.grupo}
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          <Save size={16} />
          {t('meuperfil.salvar')}
        </button>
      </form>
    </div>
  );
};

export default MeuPerfil;
