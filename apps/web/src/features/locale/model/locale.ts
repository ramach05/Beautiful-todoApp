import { createEvent, createStore } from 'effector';

import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import { applyLocale, readStoredLocale } from '@/shared/i18n';

/** UI language is client state; i18next stays the translation mechanism */
export const $locale = createStore<AppLocale>(readStoredLocale() ?? DEFAULT_LOCALE);

/** Explicit user choice: applied immediately, the app layer writes it to the profile */
export const localeChanged = createEvent<AppLocale>();

/** Resolve from the session or at startup: applied without writing to the profile */
// Exported for tests and app wiring; nothing else raises it
export const localeSuggested = createEvent<AppLocale>();

$locale.on(localeChanged, (_, locale) => locale).on(localeSuggested, (_, locale) => locale);

// Side effects of any language change: i18next, document lang, local copy.
// watch calls the callback on the store's initial value too — language is applied before the first render
$locale.watch((locale) => applyLocale(locale));
