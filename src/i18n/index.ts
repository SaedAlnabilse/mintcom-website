import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';
import { toSentenceCase } from '../utils/textCase';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const sentenceCaseTranslationKeys = new Set([
  'common.search',
  'common.searchArticles',
  'common.searchPlaceholder',
]);

function shouldSentenceCaseTranslationKey(translationKey: string): boolean {
  const keyName = translationKey.split('.').pop() || translationKey;

  return (
    /subtitle/i.test(keyName) ||
    keyName === 'searchPlaceholder' ||
    keyName === 'search_placeholder' ||
    sentenceCaseTranslationKeys.has(translationKey)
  );
}

const displayCasePostProcessor = {
  name: 'displayCase',
  type: 'postProcessor' as const,
  process(value: string, key: string | string[]) {
    const translationKey = Array.isArray(key) ? key[0] : key;

    if (
      typeof value !== 'string' ||
      !translationKey ||
      !shouldSentenceCaseTranslationKey(translationKey)
    ) {
      return value;
    }

    return toSentenceCase(value, i18n.resolvedLanguage || i18n.language || 'en');
  },
};

i18n
  .use(displayCasePostProcessor)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    postProcess: ['displayCase'],
    supportedLngs: ['en', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    saveMissing: import.meta.env?.DEV === true,
    parseMissingKeyHandler: (key) => {
      // Last-resort fallback so users never see a raw "a.b.c" key in production.
      // The `validate:locales` script catches missing keys at build time so this
      // path should normally not be hit. If it is, we humanize the leaf segment
      // (e.g. "orders.reports.items.totalSales" -> "Total sales") and log loudly
      // in development so the bug is fixed before shipping.
      if (typeof key !== 'string') return '';
      const leaf = key.includes('.') ? key.split('.').pop() || key : key;
      const humanized = leaf
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      const sentence = humanized
        ? humanized.charAt(0).toUpperCase() + humanized.slice(1).toLowerCase()
        : key;
      if (import.meta.env?.DEV === true && typeof console !== 'undefined') {
        console.error(`[i18n] Missing translation key: "${key}". Falling back to "${sentence}".`);
      }
      return sentence;
    },
    missingKeyHandler: (lngs, _ns, key) => {
      if (import.meta.env?.DEV === true && typeof console !== 'undefined') {
        console.error(`[i18n] Missing key "${key}" for languages: ${lngs.join(', ')}`);
      }
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Set initial direction
const currentLang = i18n.language || 'en';
document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLang;

export default i18n;
