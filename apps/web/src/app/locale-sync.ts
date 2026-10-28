import { sample } from 'effector';
import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import { $session, sessionFetched, updateAccountLocale } from '@/features/auth';
import { localeChanged, localeSuggested } from '@/features/locale';
import { readBrowserLocale, readStoredLocale } from '@/shared/i18n';

// Feature wiring in the composition root: features/locale and features/auth do not import each other

// Language from the session is the DB truth after login: sync the UI with the profile
sample({
  clock: sessionFetched.map((session) => session?.user.locale),
  filter: (locale): locale is AppLocale => locale !== undefined,
  target: localeSuggested,
});

// Write to the DB only an explicit choice; in the mock updateAccountLocale updates DEMO_USER
sample({ clock: localeChanged }).watch((locale) => void updateAccountLocale(locale));

/** Language resolution before the first render: session (DB) → local copy → browser → English */
export function initLocale(): void {
  const locale =
    $session.getState()?.user.locale ?? readStoredLocale() ?? readBrowserLocale() ?? DEFAULT_LOCALE;
  localeSuggested(locale);
}
