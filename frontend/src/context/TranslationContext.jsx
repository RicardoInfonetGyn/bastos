import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('idioma') || 'pt-BR'
  );

  // Função para retornar a tradução da chave
  const t = (key) => translations[key] || key;

  // ✅ Função para buscar traduções
  const fetchTranslations = async (idioma = null) => {
    const token = localStorage.getItem('token');
    const language = idioma || localStorage.getItem('idioma') || 'pt-BR';

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/i18n/traducoes', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      setTranslations(response.data || {});
      setCurrentLanguage(language);
    } catch (err) {
      console.error('Erro ao carregar traduções', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Carregar traduções inicial
  useEffect(() => {
    fetchTranslations();
  }, []);

  // ✅ Monitorar mudanças no idioma (localStorage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'idioma' && e.newValue !== currentLanguage) {
        fetchTranslations(e.newValue);
      }
    };

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Polling para mudanças no localStorage (fallback)
    const interval = setInterval(() => {
      const storedLanguage = localStorage.getItem('idioma');
      if (storedLanguage && storedLanguage !== currentLanguage) {
        fetchTranslations(storedLanguage);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentLanguage]);

  // ✅ Função para forçar recarregamento das traduções
  const reloadTranslations = () => {
    const idioma = localStorage.getItem('idioma');
    fetchTranslations(idioma);
  };

  return (
    <TranslationContext.Provider value={{ 
      translations, 
      loading, 
      t, 
      currentLanguage,
      reloadTranslations
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook para consumir as traduções
export const useTranslation = () => useContext(TranslationContext);