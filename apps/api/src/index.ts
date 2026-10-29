import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { buildApp } from '@/app.js';
import { betterAuthResolver, buildAuth } from '@/auth.js';
import { env } from '@/config.js';
import * as schema from '@/db/schema.js';
import { PostgresTodosRepository } from '@/db/todos-repo.js';
import { attachSentry, initSentry } from '@/observability.js';

initSentry();

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });
const auth = buildAuth(db);

const app = await buildApp({
  todos: new PostgresTodosRepository(db),
  session: betterAuthResolver(auth),
  auth,
  corsOrigin: env.CORS_ORIGIN.split(','),
  // In dev web may start on any localhost port (5173 busy) — no need to edit CORS_ORIGIN
  devLocalhostAnyPort: env.NODE_ENV !== 'production',
  logger: true,
  authRateLimitMax: env.AUTH_RATE_LIMIT_MAX,
  // HSTS works only behind HTTPS, so it is enabled in prod only
  hsts: env.NODE_ENV === 'production',
  trustProxy: env.TRUST_PROXY,
  readiness: async () => {
    await pool.query('SELECT 1');
  },
});
attachSentry(app);

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

/** Graceful shutdown: HTTP first, then the connection pool */
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app
      .close()
      .then(() => pool.end())
      .then(() => process.exit(0));
  });
}
