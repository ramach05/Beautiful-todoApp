import { createEvent, createStore } from 'effector';

import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import { applyLocale, readStoredLocale } from '@/shared/i18n';

/** Язык UI — клиентское состояние (ADR-002); i18next остается механизмом перевода */
export const $locale = createStore<AppLocale>(readStoredLocale() ?? DEFAULT_LOCALE);

/** Явный выбор пользователя: применяется сразу, в профиль пишет слой app */
export const localeChanged = createEvent<AppLocale>();

/** Резолв из сессии или при старте: применяется без записи в профиль */
// Экспортируется для тестов и связывания в app; сам его никто, кроме них, не порождает
export const localeSuggested = createEvent<AppLocale>();

$locale.on(localeChanged, (_, locale) => locale).on(localeSuggested, (_, locale) => locale);

// Побочные эффекты любого изменения языка: i18next, lang документа, локальная копия.
// watch вызывает колбэк и на стартовом значении стора — язык применен до первого рендера
$locale.watch((locale) => applyLocale(locale));
