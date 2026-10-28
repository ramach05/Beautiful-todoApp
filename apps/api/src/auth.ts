import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { appLocaleSchema, DEFAULT_LOCALE, parseLocale } from '@bt/shared';

import { env } from '@/config.js';
import { DEV_AUTH_SECRET } from '@/env.js';
import { DEFAULT_TODO_TITLES } from '@/db/default-todos.js';
import * as schema from '@/db/schema.js';
import { PostgresTodosRepository } from '@/db/todos-repo.js';
import type { SessionResolver } from '@/repo.js';

type AuthDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** better-auth: email+password, сессии в httpOnly cookie; таблицы управляются нашими drizzle-миграциями */
export function buildAuth(db: AuthDb) {
  return betterAuth({
    appName: 'Beautiful TodoApp',
    secret: env.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
    emailAndPassword: { enabled: true, minPasswordLength: 4 },
    // Каждому новому пользователю — стартовые задачи сразу при создании аккаунта
    databaseHooks: {
      user: {
        create: {
          // better-auth передает запись пользователя первым аргументом
          after: async (user) => {
            const repo = new PostgresTodosRepository(db);
            for (const title of DEFAULT_TODO_TITLES) {
              await repo.create({ title }, user.id);
            }
          },
        },
      },
    },
    // Управление аккаунтом из /settings: смена email и удаление аккаунта (подтверждение паролем).
    // Пользователи здесь не верифицируются SMTP, поэтому email меняется сразу (updateEmailWithoutVerification)
    user: {
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      deleteUser: { enabled: true },
      // Язык интерфейса: колонка user.locale, приезжает в getSession, пишется через updateUser/signUp.
      // validator не пускает в БД произвольные строки из публичного update-user
      additionalFields: {
        locale: {
          type: 'string',
          required: false,
          defaultValue: DEFAULT_LOCALE,
          input: true,
          validator: { input: appLocaleSchema },
        },
      },
    },
    // CORS_ORIGIN списком через запятую: origin-проверки better-auth должны знать каждый web-origin.
    // В dev дополнительно любые localhost-порты: Vite занимает следующий порт, если 5173 занят
    trustedOrigins: [
      ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:*', 'http://127.0.0.1:*']),
    ],
    // Прод: web и api на разных сайтах (vercel.app / railway.app) - сессионная cookie должна
    // отправляться cross-site, иначе браузер не приложит её к запросам; в dev/e2e оставить lax
    ...(env.NODE_ENV === 'production'
      ? {
          advanced: {
            cookies: { session_token: { attributes: { sameSite: 'none' as const, secure: true } } },
          },
        }
      : {}),
  });
}

export type Auth = ReturnType<typeof buildAuth>;

/** SessionResolver поверх better-auth: пользователя запроса берет из сессионной cookie */
export function betterAuthResolver(auth: Auth): SessionResolver {
  return {
    async resolve(headers: Headers) {
      const session = await auth.api.getSession({ headers });
      if (!session) {
        return null;
      }
      return {
        id: session.user.id,
        email: session.user.email,
        locale: parseLocale(session.user.locale) ?? DEFAULT_LOCALE,
      };
    },
  };
}
