import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, parseLocale, type AppLocale } from '@bt/shared';

import en from './locales/en.json';
import ru from './locales/ru.json';

const STORAGE_KEY = 'bt-locale';

// Словари в бандле: смена языка синхронная, без мигания и без backend-загрузчика
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru } },
  lng: readStoredLocale() ?? DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ['en', 'ru'],
});

/** Применяет язык: i18next, lang документа и локальная копия для гостей и следующего визита */
export function applyLocale(locale: AppLocale): void {
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  document.documentElement.lang = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Приватный режим Safari ломает localStorage: локальная копия не критична
  }
}

/** Язык, сохраненный в браузере: выбор гостя или последний примененный */
export function readStoredLocale(): AppLocale | null {
  try {
    return parseLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Приватный режим Safari: считаем, что сохраненного языка нет
    return null;
  }
}

/** Подсказка из браузерной локали: из поддерживаемых распознаем русский */
export function readBrowserLocale(): AppLocale | null {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : null;
}

export { i18n };
