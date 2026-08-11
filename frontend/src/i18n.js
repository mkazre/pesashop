import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import sn from './locales/sn/translation.json';
import bem from './locales/bem/translation.json';
import ny from './locales/ny/translation.json';
import zu from './locales/zu/translation.json';

// Zimbabwean/Northern Ndebele is intentionally excluded: no translation API
// supports it (Google Cloud Translation only has Southern Ndebele, "nr",
// which is a related but distinct language) — it would need a human/
// community translator, not machine translation. Re-add here + in
// backend/services/translationService.js's SUPPORTED_TARGET_LANGS if that
// becomes available.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'sn', label: 'Shona', nativeLabel: 'chiShona' },
  { code: 'bem', label: 'Bemba', nativeLabel: 'Ichibemba' },
  { code: 'ny', label: 'Chichewa', nativeLabel: 'Chichewa' },
  { code: 'zu', label: 'Zulu', nativeLabel: 'isiZulu' },
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
