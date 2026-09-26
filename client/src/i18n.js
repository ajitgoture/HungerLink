import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import kn from './locales/kn.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ml from './locales/ml.json';
import ta from './locales/ta.json';
import te from './locales/te.json';

const resources = {
  en: { translation: en },
  kn: { translation: kn },
  hi: { translation: hi },
  mr: { translation: mr },
  ml: { translation: ml },
  ta: { translation: ta },
  te: { translation: te }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'kn', 'hi', 'mr', 'ml', 'ta', 'te'],
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    saveMissing: true,
    missingKeyHandler: (ng, ns, key, fallbackValue) => {
      console.warn(`[i18n CHECKER] Missing translation key detected: "${key}"`);
      // In a real automated test we could throw an error here, but for development we log it prominently.
    }
  });

export default i18n;
