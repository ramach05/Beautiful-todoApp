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

/** better-auth: email+password, sessions in an httpOnly cookie; tables are managed by our drizzle migrations */
export function buildAuth(db: AuthDb) {
  return betterAuth({
    appName: 'Beautiful TodoApp',
    secret: env.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
    emailAndPassword: { enabled: true, minPasswordLength: 4 },
    // Every new user gets starter todos right at account creation
    databaseHooks: {
      user: {
        create: {
          // better-auth passes the user record as the first argument
          after: async (user) => {
            const repo = new PostgresTodosRepository(db);
            for (const title of DEFAULT_TODO_TITLES) {
              await repo.create({ title }, user.id);
            }
          },
        },
      },
    },
    // Account management from /settings: change email and delete account (password confirmation).
    // Users aren't SMTP-verified here, so the email changes right away (updateEmailWithoutVerification)
    user: {
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      deleteUser: { enabled: true },
      // UI language: user.locale column, arrives in getSession, written via updateUser/signUp.
      // the validator keeps arbitrary strings from the public update-user out of the DB
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
    // CORS_ORIGIN as a comma-separated list: better-auth origin checks must know every web origin.
    // In dev, any localhost ports are added: Vite takes the next port if 5173 is busy
    trustedOrigins: [
      ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:*', 'http://127.0.0.1:*']),
    ],
    // Prod: web and api live on different sites (vercel.app / railway.app) - the session cookie must
    // be sent cross-site, otherwise the browser won't attach it to requests; keep lax in dev/e2e
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

/** SessionResolver on top of better-auth: resolves the request user from the session cookie */
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
