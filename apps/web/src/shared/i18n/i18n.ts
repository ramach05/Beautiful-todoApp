import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, parseLocale, type AppLocale } from '@bt/shared';

import en from './locales/en.json';
import ru from './locales/ru.json';

const STORAGE_KEY = 'bt-locale';

// Dictionaries in the bundle: language switch is synchronous, no flicker and no backend loader
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru } },
  lng: readStoredLocale() ?? DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ['en', 'ru'],
});

/** Applies the language: i18next, document lang and a local copy for guests and the next visit */
export function applyLocale(locale: AppLocale): void {
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  document.documentElement.lang = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Safari private mode breaks localStorage: the local copy is not critical
  }
}

/** Language stored in the browser: the guest's choice or the last applied one */
export function readStoredLocale(): AppLocale | null {
  try {
    return parseLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Safari private mode: assume no stored language
    return null;
  }
}

/** Hint from the browser locale: among the supported ones we detect Russian */
export function readBrowserLocale(): AppLocale | null {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : null;
}

export { i18n };
