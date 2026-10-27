import 'i18next';

import type en from './locales/en.json';

// Ключи словаря из en.json: опечатка в t() — ошибка компиляции
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
