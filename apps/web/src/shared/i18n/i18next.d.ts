import 'i18next';

import type en from './locales/en.json';

// Dictionary keys from en.json: a typo in t() is a compile error
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
