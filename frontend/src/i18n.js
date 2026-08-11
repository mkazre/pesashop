import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import sn from './locales/sn/translation.json';
import bem from './locales/bem/translation.json';
import ny from './locales/ny/translation.json';
import zu from './locales/zu/translation.json';
import nd from './locales/nd/translation.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'sn', label: 'Shona', nativeLabel: 'chiShona' },
  { code: 'bem', label: 'Bemba', nativeLabel: 'Ichibemba' },
  { code: 'ny', label: 'Chichewa', nativeLabel: 'Chichewa' },
  { code: 'zu', label: 'Zulu', nativeLabel: 'isiZulu' },
  { code: 'nd', label: 'Ndebele', nativeLabel: 'isiNdebele' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      sn: { translation: sn },
      bem: { translation: bem },
      ny: { translation: ny },
      zu: { translation: zu },
      nd: { translation: nd },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pesashop_language',
    },
    returnEmptyString: false,
  });

export default i18n;
