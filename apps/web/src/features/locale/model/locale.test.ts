import { beforeEach, expect, it, vi } from 'vitest';

import { i18n } from '@/shared/i18n';

import { $locale, localeChanged, localeSuggested } from './locale';

beforeEach(() => {
  window.localStorage.clear();
  localeSuggested('en');
});

it('явный выбор меняет стор, i18next и локальную копию', async () => {
  localeChanged('ru');

  expect($locale.getState()).toBe('ru');
  expect(window.localStorage.getItem('bt-locale')).toBe('ru');
  await vi.waitFor(() => expect(i18n.language).toBe('ru'));
});

it('предложенный язык применяется без изменений стора после повторного того же значения', () => {
  localeSuggested('ru');
  expect($locale.getState()).toBe('ru');

  localeSuggested('ru');
  expect($locale.getState()).toBe('ru');
});
