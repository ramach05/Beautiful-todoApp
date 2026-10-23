import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { buildAuth } from '../auth.js';
import { env } from '../config.js';
import * as schema from './schema.js';
import { users } from './schema.js';
import { PostgresTodosRepository } from './todos-repo.js';

const SEED_TITLES = ['Buy groceries', 'Call mom', 'Do homework', 'Iron the shirt'];

const SEED_USERS = [
  {
    credentials: { email: 'demo@local.test', password: 'demo-pass-123', name: 'Demo' },
    todos: SEED_TITLES,
  },
  // Пользователь для ручного тестирования UI: короткий пароль, стандартный список задач
  {
    credentials: { email: 'test_user@local.test', password: '1234', name: 'test_user' },
    todos: SEED_TITLES,
  },
];

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });
const auth = buildAuth(db);
const repo = new PostgresTodosRepository(db);

for (const { credentials, todos } of SEED_USERS) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, credentials.email));

  if (existing.length > 0) {
    console.log(`Пользователь ${credentials.email} уже существует, пропущен`);
    continue;
  }

  // Пароль хэширует better-auth: пользователь создается через его API, а не прямой вставкой
  const created = await auth.api.signUpEmail({ body: credentials });
  for (const title of todos) {
    await repo.create({ title }, created.user.id);
  }
  console.log(`Создан пользователь ${credentials.email}, задач: ${todos.length}`);
}

await pool.end();
