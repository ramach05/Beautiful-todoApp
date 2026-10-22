import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from './config.js';
import * as schema from './db/schema.js';
import { PostgresTodosRepository } from './db/todos-repo.js';
import { buildApp } from './app.js';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });

const app = await buildApp({
  context: { todos: new PostgresTodosRepository(db) },
  corsOrigin: env.CORS_ORIGIN.split(','),
  logger: true,
});

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

/** Корректное завершение: сначала HTTP, потом пул соединений */
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app
      .close()
      .then(() => pool.end())
      .then(() => process.exit(0));
  });
}
