import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { buildAuth } from '@/auth.js';
import { env } from '@/config.js';
import { DEFAULT_TODO_TITLES } from '@/db/default-todos.js';
import * as schema from '@/db/schema.js';
import { users } from '@/db/schema.js';
import { PostgresTodosRepository } from '@/db/todos-repo.js';

// On top of the 3 starter todos (issued by databaseHooks in buildAuth) — test user only: 7 in total
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
  // User for manual UI testing: short password, extended todo list
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
    console.log(`User ${credentials.email} already exists, skipped`);
    continue;
  }

  // better-auth hashes the password: the user is created through its API, not a direct insert;
  // starter todos are created by the hook at sign-up
  const created = await auth.api.signUpEmail({ body: credentials });
  for (const title of extraTodos) {
    await repo.create({ title }, created.user.id);
  }
  console.log(
    `Created user ${credentials.email}, todos: ${DEFAULT_TODO_TITLES.length + extraTodos.length}`,
  );
}

await pool.end();
