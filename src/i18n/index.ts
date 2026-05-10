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
