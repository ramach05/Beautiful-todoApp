import { z } from 'zod';

/** App UI languages: single source for api and web */
export const appLocaleSchema = z.enum(['en', 'ru']);
export type AppLocale = z.infer<typeof appLocaleSchema>;

/** English: user default in the DB and the final UI fallback */
export const DEFAULT_LOCALE: AppLocale = 'en';

/** Narrow a locale from an untrusted boundary (DB, localStorage, navigator) */
export function parseLocale(value: unknown): AppLocale | null {
  const result = appLocaleSchema.safeParse(value);
  return result.success ? result.data : null;
}
