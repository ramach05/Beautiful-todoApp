import { beforeEach, expect, it } from 'vitest';

import { sessionFetched } from '@/features/auth';
import { $locale, localeSuggested } from '@/features/locale';

import { initLocale } from './locale-sync';

beforeEach(() => {
  window.localStorage.clear();
  sessionFetched(null);
  localeSuggested('en');
});

it('initLocale resolves from localStorage, then the browser, then English', () => {
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
