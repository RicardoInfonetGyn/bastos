import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import frFR from './locales/fr-FR.json';
import esES from './locales/es-ES.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
      escapeValue: false, // react já escapa por padrão
    },
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'fr-FR': { translation: frFR },
      'es-ES': { translation: esES },
    },
  });

export default i18n;
