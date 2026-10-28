import { beforeEach, expect, it, vi } from 'vitest';

import { i18n } from '@/shared/i18n';

import { $locale, localeChanged, localeSuggested } from './locale';

beforeEach(() => {
  window.localStorage.clear();
  localeSuggested('en');
});

it('an explicit choice updates the store, i18next and localStorage', async () => {
  localeChanged('ru');

  expect($locale.getState()).toBe('ru');
  expect(window.localStorage.getItem('bt-locale')).toBe('ru');
  await vi.waitFor(() => expect(i18n.language).toBe('ru'));
});
