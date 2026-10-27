import { sample } from 'effector';
import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import { $session, sessionFetched, updateAccountLocale } from '@/features/auth';
import { localeChanged, localeSuggested } from '@/features/locale';
import { readBrowserLocale, readStoredLocale } from '@/shared/i18n';

// Связывание фич в composition root: features/locale и features/auth не импортируют друг друга

// Язык из сессии — правда БД после входа: синхронизируем UI с профилем
sample({
  clock: sessionFetched.map((session) => session?.user.locale),
  filter: (locale): locale is AppLocale => locale !== undefined,
  target: localeSuggested,
});

// В БД пишем только явный выбор; в моке updateAccountLocale обновляет DEMO_USER
sample({ clock: localeChanged }).watch((locale) => void updateAccountLocale(locale));

/** Резолв языка до первого рендера: сессия (БД) → локальная копия → браузер → английский */
export function initLocale(): void {
  const locale =
    $session.getState()?.user.locale ?? readStoredLocale() ?? readBrowserLocale() ?? DEFAULT_LOCALE;
  localeSuggested(locale);
}
