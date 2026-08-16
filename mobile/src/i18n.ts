import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import sn from './locales/sn/translation.json';
import bem from './locales/bem/translation.json';
import ny from './locales/ny/translation.json';
import zu from './locales/zu/translation.json';

// Mirrors frontend/src/i18n.js's SUPPORTED_LANGUAGES exactly — same
// resources, same set. Northern Ndebele stays excluded for the same reason
// as web: no translation API supports it.
export const SUPPORTED_LANGUAGES = [
  { code: 'en',  label: 'English',  nativeLabel: 'English' },
  { code: 'fr',  label: 'French',   nativeLabel: 'Français' },
  { code: 'sn',  label: 'Shona',    nativeLabel: 'chiShona' },
  { code: 'bem', label: 'Bemba',    nativeLabel: 'Ichibemba' },
  { code: 'ny',  label: 'Chichewa', nativeLabel: 'Chichewa' },
  { code: 'zu',  label: 'Zulu',     nativeLabel: 'isiZulu' },
];

const STORAGE_KEY = 'pesashop_language';
const deviceLang = getLocales?.()[0]?.languageCode ?? 'en';
const initialLang = SUPPORTED_LANGUAGES.some(l => l.code === deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en }, fr: { translation: fr }, sn: { translation: sn },
    bem: { translation: bem }, ny: { translation: ny }, zu: { translation: zu },
  },
  lng: initialLang,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  compatibilityJSON: 'v3',
});

// Renders with the device-locale guess immediately (no flash of untranslated
// content waiting on AsyncStorage), then swaps to the user's explicit past
// choice once it resolves, same two-step as web's browser-language-detector
// (localStorage checked before falling back to navigator language).
AsyncStorage.getItem(STORAGE_KEY).then(saved => {
  if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
});

export async function setLanguage(code: string) {
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
