import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Only bundle the fallback locale; lazy-load the rest
import es from './locales/es.json';

// Language code mapping for backwards compatibility
// Maps old codes (EN, CN, ES, FR, DE) to i18next codes (en, zh, es, fr, de)
export const LANGUAGE_MAP = {
  EN: 'en',
  CN: 'zh',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
} as const;

export const REVERSE_LANGUAGE_MAP = {
  en: 'EN',
  zh: 'CN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
} as const;

export type LegacyLanguage = keyof typeof LANGUAGE_MAP;
export type I18nLanguage = keyof typeof REVERSE_LANGUAGE_MAP;

const SUPPORTED_LANGS = ['en', 'zh', 'es', 'fr', 'de'];

const localeLoaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  en: () => import('./locales/en.json'),
  zh: () => import('./locales/zh.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
};

/** Dynamically load and register a locale bundle. */
export const loadLocale = async (lng: string): Promise<void> => {
  if (lng === 'es' || !localeLoaders[lng]) return;
  if (i18n.hasResourceBundle(lng, 'translation')) return;
  const mod = await localeLoaders[lng]();
  i18n.addResourceBundle(lng, 'translation', mod.default);
};

// Detect stored language (same logic as LanguageDetector with localStorage order)
const stored = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const initialLng = stored && SUPPORTED_LANGS.includes(stored) ? stored : 'es';

// Pre-load the detected language then initialize i18n
export const i18nReady: Promise<void> = (async () => {
  const resources: Resource = {
    es: { translation: es },
  };

  // If the user's language isn't es, load it before init to avoid a flash
  if (initialLng !== 'es' && localeLoaders[initialLng]) {
    const mod = await localeLoaders[initialLng]();
    resources[initialLng] = { translation: mod.default };
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLng,
      fallbackLng: 'es',
      supportedLngs: SUPPORTED_LANGS,
      interpolation: {
        escapeValue: false,
      },
    });

  // Lazy-load locale bundles on future language switches
  i18n.on('languageChanged', (lng) => {
    loadLocale(lng);
  });
})();

// Helper to convert legacy language code to i18next code
export const toI18nLang = (legacyLang: LegacyLanguage): I18nLanguage => {
  return LANGUAGE_MAP[legacyLang];
};

// Helper to convert i18next code to legacy language code
export const toLegacyLang = (i18nLang: string): LegacyLanguage => {
  return REVERSE_LANGUAGE_MAP[i18nLang as I18nLanguage] || 'ES';
};

export default i18n;
