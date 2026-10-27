import { z } from 'zod';

/** Языки интерфейса приложения: единый источник для api и web */
export const appLocaleSchema = z.enum(['en', 'ru']);
export type AppLocale = z.infer<typeof appLocaleSchema>;

/** Английский: дефолт пользователя в БД и финальный fallback UI */
export const DEFAULT_LOCALE: AppLocale = 'en';

/** Сужение локали с непроверенной границы (БД, localStorage, navigator) */
export function parseLocale(value: unknown): AppLocale | null {
  const result = appLocaleSchema.safeParse(value);
  return result.success ? result.data : null;
}
