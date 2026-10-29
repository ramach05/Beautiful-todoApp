import { expect, it } from 'vitest';

import { DEFAULT_LOCALE, appLocaleSchema, parseLocale } from './locale.js';

// Keep mutable-package tests flat (no describe): the Stryker per-test filter with vitest 5
// does not match nested tests, so mutants survive even when covered.

it('appLocaleSchema accepts only the supported languages', () => {
  expect(appLocaleSchema.safeParse('en').success).toBe(true);
  expect(appLocaleSchema.safeParse('ru').success).toBe(true);
  expect(appLocaleSchema.safeParse('de').success).toBe(false);
});

it('parseLocale narrows trusted values and rejects the rest', () => {
  expect(parseLocale('en')).toBe('en');
  expect(parseLocale('ru')).toBe('ru');
  expect(parseLocale('EN')).toBeNull();
  expect(parseLocale(null)).toBeNull();
  expect(parseLocale(undefined)).toBeNull();
  expect(parseLocale(7)).toBeNull();
});

it('the default locale is english', () => {
  expect(DEFAULT_LOCALE).toBe('en');
  expect(appLocaleSchema.safeParse(DEFAULT_LOCALE).success).toBe(true);
});
