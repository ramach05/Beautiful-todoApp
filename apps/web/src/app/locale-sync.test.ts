import { beforeEach, expect, it, vi } from 'vitest';

import { sessionFetched } from '@/features/auth';
import { $locale, localeChanged, localeSuggested } from '@/features/locale';
import { i18n } from '@/shared/i18n';

import { initLocale } from './locale-sync';

beforeEach(() => {
  window.localStorage.clear();
  sessionFetched(null);
  localeSuggested('en');
});

it('язык из сессии применяется без записи в профиль', async () => {
  const { DEMO_USER } = await import('@bt/api/testing');
  DEMO_USER.locale = 'en';

  sessionFetched({ user: { id: 'x', email: 'x@y.z', locale: 'ru' } });

  expect($locale.getState()).toBe('ru');
  await vi.waitFor(() => expect(i18n.language).toBe('ru'));
  expect(DEMO_USER.locale).toBe('en');
});

it('явный выбор сохраняется в профиль', async () => {
  const { DEMO_USER } = await import('@bt/api/testing');

  localeChanged('ru');
  await vi.waitFor(() => expect(DEMO_USER.locale).toBe('ru'));
});

it('initLocale без сессии берет локальную копию, затем браузер, иначе английский', () => {
  window.localStorage.setItem('bt-locale', 'ru');
  initLocale();
  expect($locale.getState()).toBe('ru');

  window.localStorage.clear();
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => 'ru-RU',
  });
  initLocale();
  expect($locale.getState()).toBe('ru');
  Reflect.deleteProperty(window.navigator, 'language');

  initLocale();
  expect($locale.getState()).toBe('en');
});
