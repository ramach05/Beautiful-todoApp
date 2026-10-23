import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { env } from './config.js';
import { DEV_AUTH_SECRET } from './env.js';
import * as schema from './db/schema.js';
import type { SessionResolver } from './repo.js';

type AuthDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** better-auth: email+password, сессии в httpOnly cookie; таблицы управляются нашими drizzle-миграциями */
export function buildAuth(db: AuthDb) {
  return betterAuth({
    appName: 'Beautiful TodoApp',
    secret: env.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
    emailAndPassword: { enabled: true, minPasswordLength: 4 },
    trustedOrigins: [env.CORS_ORIGIN],
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
      return { id: session.user.id, email: session.user.email };
    },
  };
}
