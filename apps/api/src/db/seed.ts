import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { buildAuth } from '../auth.js';
import { env } from '../config.js';
import { DEFAULT_TODO_TITLES } from './default-todos.js';
import * as schema from './schema.js';
import { users } from './schema.js';
import { PostgresTodosRepository } from './todos-repo.js';

// Сверх стартовых 3 задач (их выдает databaseHooks в buildAuth) — только тестовому: итого 7
const TEST_USER_EXTRA_TITLES = [
  'Iron the shirt',
  'Pay the bills',
  'Water the plants',
  'Read a book',
];

const SEED_USERS = [
  {
    credentials: { email: 'demo@local.test', password: 'demo-pass-123', name: 'Demo' },
    extraTodos: [] as string[],
  },
  // Пользователь для ручного тестирования UI: короткий пароль, расширенный список задач
  {
    credentials: { email: 'test_user@local.test', password: '1234', name: 'test_user' },
    extraTodos: TEST_USER_EXTRA_TITLES,
  },
];

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });
const auth = buildAuth(db);
const repo = new PostgresTodosRepository(db);

for (const { credentials, extraTodos } of SEED_USERS) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, credentials.email));

  if (existing.length > 0) {
    console.log(`Пользователь ${credentials.email} уже существует, пропущен`);
    continue;
  }

  // Пароль хэширует better-auth: пользователь создается через его API, а не прямой вставкой;
  // стартовые задачи создаются хуком при регистрации
  const created = await auth.api.signUpEmail({ body: credentials });
  for (const title of extraTodos) {
    await repo.create({ title }, created.user.id);
  }
  console.log(
    `Создан пользователь ${credentials.email}, задач: ${DEFAULT_TODO_TITLES.length + extraTodos.length}`,
  );
}

await pool.end();
